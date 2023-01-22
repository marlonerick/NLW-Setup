import Fastify from "fastify";
import cors from '@fastify/cors'
import { appRoutes } from "./route";

const app = Fastify()

app.register(cors)
app.register(appRoutes)

app.listen({
    port: 3333,
    host: '0.0.0.0',
}).then(() => {
    // servidor online mensagem avisando quando esta no ar
    console.log(' HTTP Servidor Online')
})