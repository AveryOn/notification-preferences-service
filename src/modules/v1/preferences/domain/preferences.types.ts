export interface UserPreference {
  id: string
  userId: string
  notificationTypeId: string
  notificationTypeCode: string
  notificationTypeName: string
  isTransactional: boolean
  channelId: string
  channelCode: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PreferenceSelector {
  notificationTypeId: string
  channelId: string
}

export interface UpdatePreferenceInput extends PreferenceSelector {
  enabled: boolean
}

export class PreferencesNotInitializedError extends Error {
  override readonly name = 'PreferencesNotInitializedError'

  constructor(userId: string) {
    super(`Preferences are not initialized for user: ${userId}`)
  }
}

export class PreferenceReferenceNotFoundError extends Error {
  override readonly name = 'PreferenceReferenceNotFoundError'
}

export class DefaultPreferenceNotFoundError extends Error {
  override readonly name = 'DefaultPreferenceNotFoundError'
}
