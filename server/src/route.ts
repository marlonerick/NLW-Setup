import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from "./lib/prisma"

export async function appRoutes(app: FastifyInstance) {
    //Metodo HTTP : get, post, put, patch, delete;

    app.post('/habits', async (request) => {
        const createHabitBody = z.object({
            title: z.string(),
            weekDays: z.array(z.number().min(0).max(6))
        })
        // [0, 1, 2 ....5, 6] => Domingo, Segunda, Terça

        const { title, weekDays } = createHabitBody.parse(request.body)

        //2023-01-02T03:00:00.000z ele zera o horario
        const today = dayjs().startOf('day').toDate()

        await prisma.habit.create({
            data: {
                title,
                created_at: new Date(),
                HabitWeekDays: {
                    create: weekDays.map(weekDay => {
                        return {
                            week_day: weekDay,
                        }
                    })

                }
            }
        })
    })

    app.get('/day', async (request) => {
        const getDayParams = z.object({
            date: z.coerce.date(),
        })

        const { date } = getDayParams.parse(request.query)

        const parsedDate = dayjs(date).startOf('day')
        const weekDay = parsedDate.get('day')

        const possibleHabits = await prisma.habit.findMany({
            where: {
                created_at: {
                    lte: date,
                },
                HabitWeekDays: {
                    some: {
                        week_day: weekDay,
                    }
                }
            },
        })

        const day = await prisma.day.findFirst({
            where: {
                date: parsedDate.toDate(),
            },
            include: {
                dayHabits: true,
            }
        })

        const completedHabits = day?.dayHabits.map(dayHabit => {
            return dayHabit.habit_id
        }) ?? []

        return {
            possibleHabits,
            completedHabits,
        }
    })


    app.patch('/habits/:id/toggle', async (request) => {
        //id = route param => parâmetro de identificação

        const toggleHabitParams = z.object({
            id: z.string().uuid(),
        })

        const { id } = toggleHabitParams.parse(request.params)

        const today = dayjs().startOf('day').toDate()

        let day = await prisma.day.findUnique({
            where: {
                date: today,
            }
        })

        if (!day) {
            day = await prisma.day.create({
                data: {
                    date: today,
                }
            })
        }

        const dayHabit = await prisma.dayHabit.findUnique({
            where: {
                day_id_habit_id: {
                    day_id: day.id,
                    habit_id: id,
                }
            }
        })

        if (dayHabit) {
            //remover a marcação de completo
            await prisma.dayHabit.delete({
                where: {
                    id: dayHabit.id,
                }
            })
        } else {
            // Completar o hábito nesse dia
            await prisma.dayHabit.create({
                data: {
                    day_id: day.id,
                    habit_id: id,
                }
            })
        }
    })


    app.get('/summary', async () => {
        const summary = await prisma.$queryRaw`
          SELECT 
            D.id, 
            D.date,
            (
              SELECT 
                cast(count(*) as float)
              FROM day_habits DH
              WHERE DH.day_id = D.id
            ) as completed,
            (
              SELECT
                cast(count(*) as float)
              FROM habit_week_days HDW
              JOIN habits H
                ON H.id = HDW.habit_id
              WHERE
                HDW.week_day = cast(strftime('%w', D.date/1000.0, 'unixepoch') as int)
                AND H.created_at <= D.date
            ) as amount
          FROM days D
        `

        return summary
    })
}