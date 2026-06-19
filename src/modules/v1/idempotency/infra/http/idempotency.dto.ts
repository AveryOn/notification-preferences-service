import { z } from 'zod'

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(1, 'Idempotency-Key is required')
  .max(255, 'Idempotency-Key is too long')

export type IdempotencyKeyDto = z.infer<typeof idempotencyKeySchema>
