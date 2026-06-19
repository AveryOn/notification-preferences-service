import type { EvaluationResult } from '~/modules/v1/evaluation/domain/evaluation.types'

import { z } from 'zod'
import {
  isoDateTimeSchema,
  userIdSchema
} from '~/infra/transport/http/http.schemas'

export const evaluateNotificationBodySchema = z
  .object({
    userId: userIdSchema,
    notificationTypeId: z.uuid(),
    channelId: z.uuid(),
    region: z.string().trim().min(1).max(100),
    datetime: isoDateTimeSchema
  })
  .strict()

export const evaluationResponseSchema = z
  .object({
    decision: z.enum(['allow', 'deny']),
    reasons: z.array(z.string().min(1))
  })
  .strict()

export type EvaluateNotificationBodyDto = z.infer<
  typeof evaluateNotificationBodySchema
>
export type EvaluationResponseDto = z.infer<
  typeof evaluationResponseSchema
>

export function toEvaluationResponse(
  result: EvaluationResult
): EvaluationResponseDto {
  return evaluationResponseSchema.parse(result)
}
