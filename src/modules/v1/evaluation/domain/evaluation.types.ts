export type EvaluationDecision = 'allow' | 'deny'

export interface EvaluateNotificationInput {
  userId: string
  notificationType: string
  channel: string
  region: string
  datetime: Date
}

export interface EvaluationResult {
  decision: EvaluationDecision
  reasons: string[]
}

export class EvaluationPreferenceNotFoundError extends Error {
  override readonly name = 'EvaluationPreferenceNotFoundError'

  constructor(notificationType: string, channel: string) {
    super(`Preference was not found for ${notificationType}:${channel}`)
  }
}
