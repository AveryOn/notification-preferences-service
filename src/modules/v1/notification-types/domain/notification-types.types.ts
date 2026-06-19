export interface NotificationType {
  id: string
  code: string
  name: string
  isTransactional: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateNotificationTypeInput {
  code: string
  name: string
  isTransactional: boolean
}

export interface UpdateNotificationTypeInput {
  code?: string
  name?: string
  isTransactional?: boolean
  isActive?: boolean
}

export class NotificationTypeNotFoundError extends Error {
  override readonly name = 'NotificationTypeNotFoundError'
}

export class NotificationTypeCodeConflictError extends Error {
  override readonly name = 'NotificationTypeCodeConflictError'
}
