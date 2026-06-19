import { z } from 'zod'

export const evaluateNotificationBodySchema = z
  .object({
    userId: z.string().trim().min(1),
    notificationType: z.string().trim().min(1),
    channel: z.string().trim().min(1),
    region: z.string().trim().min(1),
    datetime: z.iso.datetime({ offset: true })
  })
  .strict()

export type EvaluateNotificationBodyDto = z.infer<
  typeof evaluateNotificationBodySchema
>
