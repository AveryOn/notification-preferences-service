import type {
  CreateNotificationTypeInput,
  NotificationType,
  UpdateNotificationTypeInput
} from '~/modules/v1/notification-types/domain/notification-types.types'

export abstract class NotificationTypesRepositoryPort {
  abstract findAll(): Promise<NotificationType[]>

  abstract findById(id: string): Promise<NotificationType | null>

  abstract findByCode(code: string): Promise<NotificationType | null>

  abstract create(
    input: CreateNotificationTypeInput
  ): Promise<NotificationType>

  abstract update(
    id: string,
    input: UpdateNotificationTypeInput
  ): Promise<NotificationType | null>
}
