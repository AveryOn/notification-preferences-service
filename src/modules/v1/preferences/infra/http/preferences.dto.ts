import { z } from 'zod'

export const preferencesParamsSchema = z.object({
  userId: z.string().trim().min(1, 'userId is required')
})

export const updatePreferenceBodySchema = z.object({
  notificationType: z.string().trim().min(1),
  channel: z.string().trim().min(1),
  enabled: z.boolean()
})

export const resetPreferenceBodySchema = z.object({
  notificationType: z.string().trim().min(1),
  channel: z.string().trim().min(1)
})

export type PreferencesParamsDto = z.infer<typeof preferencesParamsSchema>
export type UpdatePreferenceBodyDto = z.infer<
  typeof updatePreferenceBodySchema
>
export type ResetPreferenceBodyDto = z.infer<
  typeof resetPreferenceBodySchema
>
