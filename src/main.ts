import express from 'express'
import helmet from 'helmet'

import { env } from '~/core/config/env'
import { httpLoggerMiddleware } from '~/infra/transport/http/http-logger.middleware'
import { logger } from '~/infra/logger/logger.factory'
import cors from '~/core/plugins/cors'

const app = express()

const isProduction = env.NODE_ENV === 'production'

app.disable('x-powered-by')
app.set('trust proxy', env.TRUST_PROXY)

app.use(httpLoggerMiddleware)

app.use(
  cors({
    origin: isProduction
      ? env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
      : true,
    credentials: true
  })
)

if (isProduction) {
  app.use(helmet())
}

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

app.get('/health', (_request, response) => {
  response.status(200).json({
    status: 'ok'
  })
})

app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      environment: env.NODE_ENV
    },
    'HTTP server started'
  )
})
