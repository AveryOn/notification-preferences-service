import { z } from 'zod'

const codeSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
    'code must use lowercase snake_case'
  )

export const notificationTypeParamsSchema = z.object({
  notificationTypeId: z.uuid()
})

export const createNotificationTypeBodySchema = z
  .object({
    code: codeSchema,
    name: z.string().trim().min(1).max(255),
    isTransactional: z.boolean()
  })
  .strict()

export const updateNotificationTypeBodySchema = z
  .object({
    code: codeSchema.optional(),
    name: z.string().trim().min(1).max(255).optional(),
    isTransactional: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })

export type CreateNotificationTypeBodyDto = z.infer<
  typeof createNotificationTypeBodySchema
>
export type UpdateNotificationTypeBodyDto = z.infer<
  typeof updateNotificationTypeBodySchema
>
