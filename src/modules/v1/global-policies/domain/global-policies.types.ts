export type GlobalPolicyDecision = 'allow' | 'deny'

export interface GlobalPolicy {
  id: string
  notificationTypeId: string | null
  channelId: string | null
  region: string | null
  decision: GlobalPolicyDecision
  reason: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateGlobalPolicyInput {
  notificationTypeId?: string | null
  channelId?: string | null
  region?: string | null
  decision: GlobalPolicyDecision
  reason: string
}

export interface MatchGlobalPoliciesInput {
  notificationTypeId: string
  channelId: string
  region: string
}

export class GlobalPolicyReferenceNotFoundError extends Error {
  override readonly name = 'GlobalPolicyReferenceNotFoundError'
}

export class GlobalPolicyNotFoundError extends Error {
  override readonly name = 'GlobalPolicyNotFoundError'
}
