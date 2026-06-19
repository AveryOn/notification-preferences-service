import type { NotificationType } from '~/modules/v1/notification-types/domain/notification-types.types'

import { z } from 'zod'
import {
  isoDateTimeSchema,
  machineCodeSchema,
  toIsoDateTime
} from '~/infra/transport/http/http.schemas'

export const notificationTypeParamsSchema = z
  .object({
    notificationTypeId: z.uuid()
  })
  .strict()

export const createNotificationTypeBodySchema = z
  .object({
    code: machineCodeSchema,
    name: z.string().trim().min(1).max(255),
    isTransactional: z.boolean().default(false)
  })
  .strict()

export const updateNotificationTypeBodySchema = z
  .object({
    code: machineCodeSchema.optional(),
    name: z.string().trim().min(1).max(255).optional(),
    isTransactional: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })

export const notificationTypeResponseSchema = z
  .object({
    id: z.uuid(),
    code: machineCodeSchema,
    name: z.string().min(1).max(255),
    isTransactional: z.boolean(),
    isActive: z.boolean(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema
  })
  .strict()

export type CreateNotificationTypeBodyDto = z.infer<
  typeof createNotificationTypeBodySchema
>
export type UpdateNotificationTypeBodyDto = z.infer<
  typeof updateNotificationTypeBodySchema
>
export type NotificationTypeResponseDto = z.infer<
  typeof notificationTypeResponseSchema
>

export function toNotificationTypeResponse(
  notificationTypeEntity: NotificationType
): NotificationTypeResponseDto {
  return notificationTypeResponseSchema.parse({
    id: notificationTypeEntity.id,
    code: notificationTypeEntity.code,
    name: notificationTypeEntity.name,
    isTransactional: notificationTypeEntity.isTransactional,
    isActive: notificationTypeEntity.isActive,
    createdAt: toIsoDateTime(notificationTypeEntity.createdAt),
    updatedAt: toIsoDateTime(notificationTypeEntity.updatedAt)
  })
}
