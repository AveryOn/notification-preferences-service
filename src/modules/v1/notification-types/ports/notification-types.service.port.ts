import type {
  CreateNotificationTypeInput,
  NotificationType,
  UpdateNotificationTypeInput
} from '~/modules/v1/notification-types/domain/notification-types.types'

export abstract class NotificationTypesServicePort {
  abstract getAll(): Promise<NotificationType[]>

  abstract create(
    input: CreateNotificationTypeInput
  ): Promise<NotificationType>

  abstract update(
    id: string,
    input: UpdateNotificationTypeInput
  ): Promise<NotificationType>
}
