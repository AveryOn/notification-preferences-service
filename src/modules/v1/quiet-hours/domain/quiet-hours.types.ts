export interface QuietHours {
  id: string
  userId: string
  startTime: string
  endTime: string
  timezone: string
  createdAt: Date
  updatedAt: Date
}

export interface UpdateQuietHoursInput {
  startTime: string
  endTime: string
  timezone: string
}

export interface SaveQuietHoursInput extends UpdateQuietHoursInput {
  userId: string
}

export class QuietHoursValidationError extends Error {
  override readonly name = 'QuietHoursValidationError'
}
