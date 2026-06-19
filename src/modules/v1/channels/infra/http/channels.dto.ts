import type { Channel } from '~/modules/v1/channels/domain/channels.types'

import { z } from 'zod'
import {
  isoDateTimeSchema,
  machineCodeSchema,
  toIsoDateTime
} from '~/infra/transport/http/http.schemas'

export const channelParamsSchema = z
  .object({
    channelId: z.uuid()
  })
  .strict()

export const createChannelBodySchema = z
  .object({
    code: machineCodeSchema,
    name: z.string().trim().min(1).max(255)
  })
  .strict()

export const updateChannelBodySchema = z
  .object({
    code: machineCodeSchema.optional(),
    name: z.string().trim().min(1).max(255).optional(),
    isActive: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })

export const channelResponseSchema = z
  .object({
    id: z.uuid(),
    code: machineCodeSchema,
    name: z.string().min(1).max(255),
    isActive: z.boolean(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema
  })
  .strict()

export type CreateChannelBodyDto = z.infer<typeof createChannelBodySchema>
export type UpdateChannelBodyDto = z.infer<typeof updateChannelBodySchema>
export type ChannelResponseDto = z.infer<typeof channelResponseSchema>

export function toChannelResponse(
  channelEntity: Channel
): ChannelResponseDto {
  return channelResponseSchema.parse({
    id: channelEntity.id,
    code: channelEntity.code,
    name: channelEntity.name,
    isActive: channelEntity.isActive,
    createdAt: toIsoDateTime(channelEntity.createdAt),
    updatedAt: toIsoDateTime(channelEntity.updatedAt)
  })
}
