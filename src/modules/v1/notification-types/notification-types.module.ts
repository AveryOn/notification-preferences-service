import type { DiProvider } from '~/core/di/types'
import { NotificationTypesService } from '~/modules/v1/notification-types/domain/notification-types.service'
import { NotificationTypesController } from '~/modules/v1/notification-types/infra/http/notification-types.controller'
import { NotificationTypesDrizzleRepository } from '~/modules/v1/notification-types/infra/persistence/notification-types.drizzle.repo'
import { NotificationTypesRepositoryPort } from '~/modules/v1/notification-types/ports/notification-types.repo.port'
import { NotificationTypesServicePort } from '~/modules/v1/notification-types/ports/notification-types.service.port'

export const notificationTypesProviders: DiProvider[] = [
  {
    token: NotificationTypesRepositoryPort,
    useClass: NotificationTypesDrizzleRepository
  },
  {
    token: NotificationTypesServicePort,
    useClass: NotificationTypesService
  },
  {
    token: NotificationTypesController,
    useClass: NotificationTypesController
  }
]
