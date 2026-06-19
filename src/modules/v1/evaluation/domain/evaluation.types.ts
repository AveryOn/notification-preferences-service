export type EvaluationDecision = 'allow' | 'deny'

export interface EvaluateNotificationInput {
  userId: string
  notificationTypeId: string
  channelId: string
  region: string
  datetime: Date
}

export interface EvaluationResult {
  decision: EvaluationDecision
  reasons: string[]
}

export class EvaluationPreferenceNotFoundError extends Error {
  override readonly name = 'EvaluationPreferenceNotFoundError'

  constructor(notificationTypeId: string, channelId: string) {
    super(
      `Preference was not found for notificationTypeId=${notificationTypeId}, channelId=${channelId}`
    )
  }
}
