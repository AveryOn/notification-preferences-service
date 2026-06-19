import { z } from 'zod'

const channelCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
    'code must use lowercase snake_case'
  )

export const channelParamsSchema = z.object({
  channelId: z.uuid()
})

export const createChannelBodySchema = z
  .object({
    code: channelCodeSchema,
    name: z.string().trim().min(1).max(255)
  })
  .strict()

export const updateChannelBodySchema = z
  .object({
    code: channelCodeSchema.optional(),
    name: z.string().trim().min(1).max(255).optional(),
    isActive: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })

export type CreateChannelBodyDto = z.infer<typeof createChannelBodySchema>
export type UpdateChannelBodyDto = z.infer<typeof updateChannelBodySchema>
