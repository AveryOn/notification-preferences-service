import type { UserPreference } from '~/modules/v1/preferences/domain/preferences.types'

import { z } from 'zod'
import {
  isoDateTimeSchema,
  machineCodeSchema,
  toIsoDateTime,
  userIdSchema
} from '~/infra/transport/http/http.schemas'

export const preferencesParamsSchema = z
  .object({
    userId: userIdSchema
  })
  .strict()

export const updatePreferenceBodySchema = z
  .object({
    notificationTypeId: z.uuid(),
    channelId: z.uuid(),
    enabled: z.boolean()
  })
  .strict()

export const resetPreferenceBodySchema = z
  .object({
    notificationTypeId: z.uuid(),
    channelId: z.uuid()
  })
  .strict()

export const userPreferenceResponseSchema = z
  .object({
    id: z.uuid(),
    userId: userIdSchema,
    notificationTypeId: z.uuid(),
    notificationTypeCode: machineCodeSchema,
    notificationTypeName: z.string().min(1).max(255),
    isTransactional: z.boolean(),
    channelId: z.uuid(),
    channelCode: machineCodeSchema,
    enabled: z.boolean(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema
  })
  .strict()

export type PreferencesParamsDto = z.infer<typeof preferencesParamsSchema>
export type UpdatePreferenceBodyDto = z.infer<
  typeof updatePreferenceBodySchema
>
export type ResetPreferenceBodyDto = z.infer<
  typeof resetPreferenceBodySchema
>
export type UserPreferenceResponseDto = z.infer<
  typeof userPreferenceResponseSchema
>

export function toUserPreferenceResponse(
  preference: UserPreference
): UserPreferenceResponseDto {
  return userPreferenceResponseSchema.parse({
    id: preference.id,
    userId: preference.userId,
    notificationTypeId: preference.notificationTypeId,
    notificationTypeCode: preference.notificationTypeCode,
    notificationTypeName: preference.notificationTypeName,
    isTransactional: preference.isTransactional,
    channelId: preference.channelId,
    channelCode: preference.channelCode,
    enabled: preference.enabled,
    createdAt: toIsoDateTime(preference.createdAt),
    updatedAt: toIsoDateTime(preference.updatedAt)
  })
}
