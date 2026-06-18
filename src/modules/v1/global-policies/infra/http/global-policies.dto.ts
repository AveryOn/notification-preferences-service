import { z } from 'zod'

const nullableCodeSchema = z.string().trim().min(1).nullable().optional()

export const createGlobalPolicyBodySchema = z.object({
  notificationType: nullableCodeSchema,
  channel: nullableCodeSchema,
  region: nullableCodeSchema,
  decision: z.enum(['allow', 'deny']),
  reason: z.string().trim().min(1)
})

export const globalPolicyParamsSchema = z.object({
  policyId: z.uuid()
})

export type CreateGlobalPolicyBodyDto = z.infer<
  typeof createGlobalPolicyBodySchema
>
export type GlobalPolicyParamsDto = z.infer<
  typeof globalPolicyParamsSchema
>
