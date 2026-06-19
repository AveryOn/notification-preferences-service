import type { Server } from 'node:http'
import type { env } from '~/env'
import type { LoggerPort } from '~/infra/logger'

import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'

import { ENV_TOKEN, LOGGER_TOKEN } from '~/app/app.tokens'
import { Inject, Injectable } from '~/core/di'
import {
  createHttpErrorHandler,
  notFoundHandler
} from '~/infra/transport/http/middlewares/http-error.middleware'

import { httpLoggerMiddleware } from '~/infra/transport/http/middlewares/http-logger.middleware'
import { ChannelsController } from '~/modules/v1/channels/infra/http/channels.controller'
import { EvaluationController } from '~/modules/v1/evaluation/infra/http/evaluation.controller'
import { GlobalPoliciesController } from '~/modules/v1/global-policies/infra/http/global-policies.controller'
import { NotificationTypesController } from '~/modules/v1/notification-types/infra/http/notification-types.controller'
import { PreferencesController } from '~/modules/v1/preferences/infra/http/preferences.controller'
import { QuietHoursController } from '~/modules/v1/quiet-hours/infra/http/quiet-hours.controller'
import { OpenApiController } from '~/infra/openapi'

type Environment = typeof env

@Injectable()
export class HttpServer {
  private readonly app: Express

  constructor(
    @Inject(ENV_TOKEN)
    private readonly environment: Environment,

    @Inject(LOGGER_TOKEN)
    private readonly logger: LoggerPort,

    @Inject(QuietHoursController)
    private readonly quietHoursController: QuietHoursController,

    @Inject(PreferencesController)
    private readonly preferencesController: PreferencesController,

    @Inject(GlobalPoliciesController)
    private readonly globalPoliciesController: GlobalPoliciesController,

    @Inject(NotificationTypesController)
    private readonly notificationTypesController: NotificationTypesController,

    @Inject(ChannelsController)
    private readonly channelsController: ChannelsController,

    @Inject(EvaluationController)
    private readonly evaluationController: EvaluationController,

    @Inject(OpenApiController)
    private readonly openApiController: OpenApiController
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
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: '1mb'
      })
    )
    // регистрация сваггера
    this.openApiController.register(this.app)

    this.quietHoursController.register(this.app)
    this.channelsController.register(this.app)
    this.preferencesController.register(this.app)
    this.globalPoliciesController.register(this.app)
    this.notificationTypesController.register(this.app)
    this.evaluationController.register(this.app)

    this.app.get('/health', (_request, response) => {
      response.status(200).json({ status: 'ok' })
    })

    this.app.use(notFoundHandler)
    this.app.use(createHttpErrorHandler(this.logger))
  }
}
