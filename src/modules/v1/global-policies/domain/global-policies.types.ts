export type GlobalPolicyDecision = 'allow' | 'deny'

export interface GlobalPolicy {
  id: string
  notificationType: string | null
  channel: string | null
  region: string | null
  decision: GlobalPolicyDecision
  reason: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateGlobalPolicyInput {
  notificationType?: string | null
  channel?: string | null
  region?: string | null
  decision: GlobalPolicyDecision
  reason: string
}

export interface MatchGlobalPoliciesInput {
  notificationType: string
  channel: string
  region: string
}

export class GlobalPolicyReferenceNotFoundError extends Error {
  override readonly name = 'GlobalPolicyReferenceNotFoundError'
}

export class GlobalPolicyNotFoundError extends Error {
  override readonly name = 'GlobalPolicyNotFoundError'
}
