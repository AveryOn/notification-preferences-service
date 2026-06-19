import { z } from 'zod'

export const machineCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
    'value must use lowercase snake_case'
  )

export const userIdSchema = z.string().trim().min(1, 'userId is required')

export const isoDateTimeSchema = z.iso.datetime({ offset: true })

export const timeWithSecondsSchema = z
  .string()
  .regex(
    /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/,
    'time must use HH:mm:ss format'
  )

export const ianaTimezoneSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isValidIanaTimezone, {
    message: 'timezone must be a valid IANA timezone'
  })

export function toIsoDateTime(value: Date): string {
  return isoDateTimeSchema.parse(value.toISOString())
}

export function normalizeTimeWithSeconds(value: string): string {
  const [hours = '00', minutes = '00', seconds = '00'] = value.split(':')

  return timeWithSecondsSchema.parse(`${hours}:${minutes}:${seconds}`)
}

function isValidIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(
      new Date()
    )
    return true
  } catch {
    return false
  }
}
