import express from 'express'
import { env } from '~/config/env'

const app = express()

app.disable('x-powered-by')
app.use(express.json())

app.get('/health', (_request, response) => {
  response.status(200).json({
    status: 'ok'
  })
})

const port = Number(process.env.APP_PORT ?? 3000)

app.listen(port, () => {
  console.log(`Server is running on port ${env.PORT}`)
})
