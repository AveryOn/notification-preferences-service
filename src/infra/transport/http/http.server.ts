import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import type { Server } from 'node:http'
import { ENV_TOKEN, LOGGER_TOKEN } from '~/core/app/app.tokens'
import type { env } from '~/env'
import { Inject, Injectable } from '~/core/di/di.container'
import { httpLoggerMiddleware } from '~/infra/transport/http/http-logger.middleware'
import type { LoggerPort } from '~/shared/logger/logger.port'

type Environment = typeof env

@Injectable()
export class HttpServer {
  private readonly app: Express

  constructor(
    @Inject(ENV_TOKEN) private readonly environment: Environment,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort
  ) {
    this.app = express()
    this.configure()
  }

  start(): Server {
    return this.app.listen(this.environment.PORT, () => {
      this.logger.info(
        {
          port: this.environment.PORT,
          environment: this.environment.NODE_ENV
        },
        'HTTP server started'
      )
    })
  }

  private configure(): void {
    const isProduction = this.environment.NODE_ENV === 'production'

    this.app.disable('x-powered-by')
    this.app.set('trust proxy', this.environment.TRUST_PROXY)
    this.app.use(httpLoggerMiddleware)
    this.app.use(
      cors({
        origin: isProduction
          ? this.environment.CORS_ORIGINS.split(',').map((origin) =>
              origin.trim()
            )
          : true,
        credentials: true
      })
    )

    if (isProduction) {
      this.app.use(helmet())
    }

    this.app.use(express.json({ limit: '1mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }))

    this.app.get('/health', (_request, response) => {
      response.status(200).json({ status: 'ok' })
    })
  }
}
