import {
  ENV_TOKEN,
  HTTP_SERVER_TOKEN,
  LOGGER_TOKEN
} from '~/app/app.tokens'
import { env } from '~/core/config/env'
import type { DiProvider } from '~/core/di/types'
import { databaseProviders } from '~/infra/database/database.providers'
import { logger } from '~/infra/logger/logger.factory'
import { HttpServer } from '~/infra/transport/http/http.server'

export const appProviders: DiProvider[] = [
  { token: ENV_TOKEN, useValue: env },
  { token: LOGGER_TOKEN, useValue: logger },
  ...databaseProviders,
  { token: HTTP_SERVER_TOKEN, useClass: HttpServer }
]
