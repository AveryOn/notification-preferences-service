import { z } from 'zod'

export const quietHoursParamsSchema = z.object({
  userId: z.string().min(1, 'userId is required')
})

export const updateQuietHoursBodySchema = z
  .object({
    startTime: z
      .string()
      .regex(
        /^(?:[01]\d|2[0-3]):[0-5]\d$/,
        'startTime must use HH:mm format'
      )
      .optional(),
    endTime: z
      .string()
      .regex(
        /^(?:[01]\d|2[0-3]):[0-5]\d$/,
        'endTime must use HH:mm format'
      )
      .optional(),
    timezone: z.string().min(1).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })

export type QuietHoursParamsDto = z.infer<typeof quietHoursParamsSchema>
export type UpdateQuietHoursBodyDto = z.infer<
  typeof updateQuietHoursBodySchema
>
