import type { ZodType } from 'zod'

import { HttpError } from '~/infra/transport/http'

export function validateRequest<TOutput>(
  schema: ZodType<TOutput>,
  value: unknown,
  code = 'invalid_request'
): TOutput {
  const result = schema.safeParse(value)

  if (!result.success) {
    throw new HttpError(400, code, 'Request validation failed', {
      issues: result.error.issues
    })
  }

  return result.data
}
