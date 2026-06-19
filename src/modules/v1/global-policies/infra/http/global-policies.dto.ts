import type { GlobalPolicy } from '~/modules/v1/global-policies/domain/global-policies.types'

import { z } from 'zod'
import {
  isoDateTimeSchema,
  toIsoDateTime
} from '~/infra/transport/http/http.schemas'

const nullableUuidSchema = z.uuid().nullable().optional()
const nullableRegionSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .nullable()
  .optional()

export const createGlobalPolicyBodySchema = z
  .object({
    notificationTypeId: nullableUuidSchema,
    channelId: nullableUuidSchema,
    region: nullableRegionSchema,
    decision: z.enum(['allow', 'deny']),
    reason: z.string().trim().min(1).max(255)
  })
  .strict()

export const globalPolicyParamsSchema = z
  .object({
    policyId: z.uuid()
  })
  .strict()

export const globalPolicyResponseSchema = z
  .object({
    id: z.uuid(),
    notificationTypeId: z.uuid().nullable(),
    channelId: z.uuid().nullable(),
    region: z.string().min(1).max(100).nullable(),
    decision: z.enum(['allow', 'deny']),
    reason: z.string().min(1).max(255),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema
  })
  .strict()

export type CreateGlobalPolicyBodyDto = z.infer<
  typeof createGlobalPolicyBodySchema
>
export type GlobalPolicyParamsDto = z.infer<
  typeof globalPolicyParamsSchema
>
export type GlobalPolicyResponseDto = z.infer<
  typeof globalPolicyResponseSchema
>

export function toGlobalPolicyResponse(
  policy: GlobalPolicy
): GlobalPolicyResponseDto {
  return globalPolicyResponseSchema.parse({
    id: policy.id,
    notificationTypeId: policy.notificationTypeId,
    channelId: policy.channelId,
    region: policy.region,
    decision: policy.decision,
    reason: policy.reason,
    createdAt: toIsoDateTime(policy.createdAt),
    updatedAt: toIsoDateTime(policy.updatedAt)
  })
}
