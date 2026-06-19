import type { QuietHours } from '~/modules/v1/quiet-hours/domain/quiet-hours.types'

import { z } from 'zod'
import {
  ianaTimezoneSchema,
  isoDateTimeSchema,
  normalizeTimeWithSeconds,
  timeWithSecondsSchema,
  toIsoDateTime,
  userIdSchema
} from '~/infra/transport/http/http.schemas'

export const quietHoursParamsSchema = z
  .object({
    userId: userIdSchema
  })
  .strict()

export const updateQuietHoursBodySchema = z
  .object({
    startTime: timeWithSecondsSchema,
    endTime: timeWithSecondsSchema,
    timezone: ianaTimezoneSchema
  })
  .strict()

export const quietHoursResponseSchema = z
  .object({
    id: z.uuid(),
    userId: userIdSchema,
    startTime: timeWithSecondsSchema,
    endTime: timeWithSecondsSchema,
    timezone: ianaTimezoneSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema
  })
  .strict()

export type QuietHoursParamsDto = z.infer<typeof quietHoursParamsSchema>
export type UpdateQuietHoursBodyDto = z.infer<
  typeof updateQuietHoursBodySchema
>
export type QuietHoursResponseDto = z.infer<
  typeof quietHoursResponseSchema
>

export function toQuietHoursResponse(
  quietHours: QuietHours
): QuietHoursResponseDto {
  return quietHoursResponseSchema.parse({
    id: quietHours.id,
    userId: quietHours.userId,
    startTime: normalizeTimeWithSeconds(quietHours.startTime),
    endTime: normalizeTimeWithSeconds(quietHours.endTime),
    timezone: quietHours.timezone,
    createdAt: toIsoDateTime(quietHours.createdAt),
    updatedAt: toIsoDateTime(quietHours.updatedAt)
  })
}
