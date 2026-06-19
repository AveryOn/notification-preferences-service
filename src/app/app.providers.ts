import type { DiProvider } from '~/core/di/types'

import {
  ENV_TOKEN,
  HTTP_SERVER_TOKEN,
  LOGGER_TOKEN
} from '~/app/app.tokens'
import { env } from '~/env'
import { databaseProviders } from '~/infra/database/database.providers'
import { logger } from '~/infra/logger/logger.factory'
import { HttpServer } from '~/infra/transport/http/http.server'
import { preferencesProviders } from '~/modules/v1/preferences/preferences.module'
import { quietHoursProviders } from '~/modules/v1/quiet-hours/quiet-hours.module'
import { globalPoliciesProviders } from '~/modules/v1/global-policies/global-policies.module'
import { idempotencyProviders } from '~/modules/v1/idempotency/idempotency.module'
import { notificationTypesProviders } from '~/modules/v1/notification-types/notification-types.module'
import { channelsProviders } from '~/modules/v1/channels/channels.module'
import { evaluationProviders } from '~/modules/v1/evaluation/evaluation.module'

export const appProviders: DiProvider[] = [
  { token: ENV_TOKEN, useValue: env },
  { token: LOGGER_TOKEN, useValue: logger },
  ...databaseProviders,
  ...quietHoursProviders,
  ...notificationTypesProviders,
  ...channelsProviders,
  ...preferencesProviders,
  ...globalPoliciesProviders,
  ...idempotencyProviders,
  ...evaluationProviders,
  { token: HTTP_SERVER_TOKEN, useClass: HttpServer }
]
