import {
  type CreateNotificationTypeInput,
  type NotificationType,
  type UpdateNotificationTypeInput
} from '~/modules/v1/notification-types/domain/notification-types.types'

import { Inject, Injectable } from '~/core/di'
import {
  NotificationTypeCodeConflictError,
  NotificationTypeNotFoundError
} from '~/modules/v1/notification-types/domain/notification-types.types'
import { NotificationTypesRepositoryPort } from '~/modules/v1/notification-types/ports/notification-types.repo.port'
import { NotificationTypesServicePort } from '~/modules/v1/notification-types/ports/notification-types.service.port'

@Injectable()
export class NotificationTypesService extends NotificationTypesServicePort {
  constructor(
    @Inject(NotificationTypesRepositoryPort)
    private readonly repository: NotificationTypesRepositoryPort
  ) {
    super()
  }

  getAll(): Promise<NotificationType[]> {
    return this.repository.findAll()
  }

  async create(
    input: CreateNotificationTypeInput
  ): Promise<NotificationType> {
    const existing = await this.repository.findByCode(input.code)

    if (existing) {
      throw new NotificationTypeCodeConflictError(
        `Notification type code already exists: ${input.code}`
      )
    }

    return this.repository.create(input)
  }

  async update(
    id: string,
    input: UpdateNotificationTypeInput
  ): Promise<NotificationType> {
    const current = await this.repository.findById(id)

    if (!current) {
      throw new NotificationTypeNotFoundError(
        `Notification type was not found: ${id}`
      )
    }

    if (input.code && input.code !== current.code) {
      const existing = await this.repository.findByCode(input.code)

      if (existing) {
        throw new NotificationTypeCodeConflictError(
          `Notification type code already exists: ${input.code}`
        )
      }
    }

    const updated = await this.repository.update(id, input)

    if (!updated) {
      throw new NotificationTypeNotFoundError(
        `Notification type was not found: ${id}`
      )
    }

    return updated
  }
}
