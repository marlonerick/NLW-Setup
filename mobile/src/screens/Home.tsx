import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { View, Text, ScrollView, Alert } from "react-native";
import { useCallback, useState } from "react";
import dayjs from "dayjs";

import { DAY_SIZE, HabitDay } from "../components/HabitDay";
import { Loading } from "../components/loading";
import { Header } from "../components/Header";
import { api } from "../lib/axios";

import { generateDatesFromYearBeginning } from '../utils/generate-dates-from-year-beginning';


const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S',]

const dateFromYearStarts = generateDatesFromYearBeginning()
const minimumSummaryDatesSizes = 18 * 5;
const amountOfDaysToFill = minimumSummaryDatesSizes - dateFromYearStarts.length

type SummaryProps = Array<{
    id: string;
    date: string;
    amount: number
    completed: number;

}>

export function Home() {

    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState<SummaryProps | null>(null)

    const { navigate } = useNavigation()

    async function fetchData() {
        try {
            setLoading(true)
            const response = await api.get('/summary');
            setSummary(response.data)
        } catch (error) {
            Alert.alert('Ops', 'Não foi possível carregar o sumário de hábitos.')
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(useCallback(() => {
        fetchData()
    }, []))

    if (loading) {
        return (
            <Loading />
        )
    }

    return (
        <View className="flex-1 bg-background px-8 pt-16">

            <Header />

            <View className="flex-row mt-6 mb-2">

                {
                    weekDays.map((weekDay, i) => (
                        <Text
                            key={`${weekDay}-${i}`}
                            className="text-zinc-400 text-xl font-bold text-center mx-1"
                            style={{ width: DAY_SIZE }}
                        >
                            {weekDay}
                        </Text>
                    ))
                }
            </View>
            <ScrollView showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 50 }}>
                {
                    summary &&
                    <View className="flex-row flex-wrap">
                        {
                            dateFromYearStarts.map(date => {

                                const dayWithHabits = summary.find(day => {
                                    return dayjs(date).isSame(day.date, 'day')
                                })

                                return (
                                    <HabitDay key={date.toISOString()}
                                        //carrega habit screen
                                        date={date}
                                        amountOfHabits={dayWithHabits?.amount}
                                        amountCompleted={dayWithHabits?.completed}
                                        onPress={() => navigate('habit', { date: date.toISOString() })}
                                    />
                                )
                            })
                        }
                        {
                            amountOfDaysToFill > 0 && Array.from({ length: amountOfDaysToFill }).map((_, index) => (
                                <View
                                    key={index}
                                    className="bg-zinc-900 rounded-lg border-2 m-1 border-zinc-800 opacity-40"
                                    style={{ width: DAY_SIZE, height: DAY_SIZE }}>

                                </View>
                            ))
                        }
                    </View>
                }
            </ScrollView>
        </View>
    )
}
