import {
  ENV_TOKEN,
  HTTP_SERVER_TOKEN,
  LOGGER_TOKEN
} from '~/core/app/app.tokens'
import { env } from '~/env'
import type { DiProvider } from '~/core/di/types'
import { databaseProviders } from '~/infra/database/database.providers'
import { logger } from '~/infra/logger/logger.factory'
import { HttpServer } from '~/infra/transport/http/http.server'
import { preferencesProviders } from '~/modules/v1/preferences/preferences.module'
import { quietHoursProviders } from '~/modules/v1/quiet-hours/quiet-hours.module'
import { globalPoliciesProviders } from '~/modules/v1/global-policies/global-policies.module'

export const appProviders: DiProvider[] = [
  { token: ENV_TOKEN, useValue: env },
  { token: LOGGER_TOKEN, useValue: logger },
  ...databaseProviders,
  ...quietHoursProviders,
  ...preferencesProviders,
  ...globalPoliciesProviders,
  { token: HTTP_SERVER_TOKEN, useClass: HttpServer }
]
