import { pgEnum } from 'drizzle-orm/pg-core'

export const globalPolicyDecisionEnum = pgEnum('global_policy_decision', [
  'allow',
  'deny'
])

export const idempotencyStatusEnum = pgEnum('idempotency_status', [
  'processing',
  'completed'
])
