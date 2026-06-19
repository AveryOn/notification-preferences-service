import type { env } from '~/env'
import type { Server } from 'node:http'
import type { LoggerPort } from '~/shared/logger/logger.port'

import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { ENV_TOKEN, LOGGER_TOKEN } from '~/app/app.tokens'
import { Inject, Injectable } from '~/core/di/di.container'
import { httpLoggerMiddleware } from '~/infra/transport/http/http-logger.middleware'
import { QuietHoursController } from '~/modules/v1/quiet-hours/infra/http/quiet-hours.controller'
import { PreferencesController } from '~/modules/v1/preferences/infra/http/preferences.controller'
import { GlobalPoliciesController } from '~/modules/v1/global-policies/infra/http/global-policies.controller'
import { NotificationTypesController } from '~/modules/v1/notification-types/infra/http/notification-types.controller'
import { ChannelsController } from '~/modules/v1/channels/infra/http/channels.controller'

type Environment = typeof env

@Injectable()
export class HttpServer {
  private readonly app: Express

  constructor(
    @Inject(ENV_TOKEN) private readonly environment: Environment,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Inject(QuietHoursController)
    private readonly quietHoursController: QuietHoursController,

    @Inject(PreferencesController)
    private readonly preferencesController: PreferencesController,

    @Inject(GlobalPoliciesController)
    private readonly globalPoliciesController: GlobalPoliciesController,

    @Inject(NotificationTypesController)
    private readonly notificationTypesController: NotificationTypesController,

    @Inject(ChannelsController)
    private readonly channelsController: ChannelsController
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

    this.quietHoursController.register(this.app)
    this.channelsController.register(this.app)
    this.preferencesController.register(this.app)
    this.globalPoliciesController.register(this.app)
    this.notificationTypesController.register(this.app)

    this.app.get('/health', (_request, response) => {
      response.status(200).json({ status: 'ok' })
    })
  }
}
