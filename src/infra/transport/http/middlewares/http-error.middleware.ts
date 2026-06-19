import type { ErrorRequestHandler, RequestHandler } from 'express'
import type { LoggerPort } from '~/shared/logger/logger.port'

import { HttpError } from '~/infra/transport/http/http.error'
import {
  ChannelCodeConflictError,
  ChannelNotFoundError
} from '~/modules/v1/channels/domain/channels.types'
import { EvaluationPreferenceNotFoundError } from '~/modules/v1/evaluation/domain/evaluation.types'
import {
  GlobalPolicyNotFoundError,
  GlobalPolicyReferenceNotFoundError
} from '~/modules/v1/global-policies/domain/global-policies.types'
import {
  IdempotencyConflictError,
  IdempotencyInProgressError
} from '~/modules/v1/idempotency/domain/idempotency.types'
import {
  NotificationTypeCodeConflictError,
  NotificationTypeNotFoundError
} from '~/modules/v1/notification-types/domain/notification-types.types'
import {
  DefaultPreferenceNotFoundError,
  PreferenceReferenceNotFoundError,
  PreferencesNotInitializedError
} from '~/modules/v1/preferences/domain/preferences.types'
import { QuietHoursValidationError } from '~/modules/v1/quiet-hours/domain/quiet-hours.types'

export const notFoundHandler: RequestHandler = (
  _request,
  _response,
  next
): void => {
  next(new HttpError(404, 'route_not_found', 'Route was not found'))
}

export function createHttpErrorHandler(
  logger: LoggerPort
): ErrorRequestHandler {
  return (error, request, response, next): void => {
    if (response.headersSent) {
      next(error)
      return
    }

    const httpError = normalizeError(error)

    if (httpError.statusCode >= 500) {
      logger.error(
        {
          requestId: response.getHeader('x-request-id'),
          method: request.method,
          path: request.originalUrl,
          error: serializeError(error)
        },
        'Unhandled HTTP error'
      )
    }

    response.status(httpError.statusCode).json({
      code: httpError.code,
      message: httpError.message,
      ...httpError.details
    })
  }
}

function normalizeError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error
  }

  if (isBodyParserError(error, 'entity.parse.failed')) {
    return new HttpError(
      400,
      'invalid_json',
      'Request body contains invalid JSON'
    )
  }

  if (isBodyParserError(error, 'entity.too.large')) {
    return new HttpError(
      413,
      'payload_too_large',
      'Request body is too large'
    )
  }

  if (error instanceof ChannelNotFoundError) {
    return new HttpError(404, 'channel_not_found', error.message)
  }

  if (error instanceof ChannelCodeConflictError) {
    return new HttpError(409, 'channel_code_conflict', error.message)
  }

  if (error instanceof NotificationTypeNotFoundError) {
    return new HttpError(404, 'notification_type_not_found', error.message)
  }

  if (error instanceof NotificationTypeCodeConflictError) {
    return new HttpError(
      409,
      'notification_type_code_conflict',
      error.message
    )
  }

  if (error instanceof GlobalPolicyReferenceNotFoundError) {
    return new HttpError(
      404,
      'global_policy_reference_not_found',
      error.message
    )
  }

  if (error instanceof GlobalPolicyNotFoundError) {
    return new HttpError(404, 'global_policy_not_found', error.message)
  }

  if (error instanceof PreferencesNotInitializedError) {
    return new HttpError(404, 'preferences_not_initialized', error.message)
  }

  if (error instanceof PreferenceReferenceNotFoundError) {
    return new HttpError(
      404,
      'preference_reference_not_found',
      error.message
    )
  }

  if (error instanceof DefaultPreferenceNotFoundError) {
    return new HttpError(
      404,
      'default_preference_not_found',
      error.message
    )
  }

  if (error instanceof QuietHoursValidationError) {
    return new HttpError(400, 'invalid_quiet_hours', error.message)
  }

  if (error instanceof EvaluationPreferenceNotFoundError) {
    return new HttpError(404, 'preference_not_found', error.message)
  }

  if (error instanceof IdempotencyConflictError) {
    return new HttpError(409, 'idempotency_key_conflict', error.message)
  }

  if (error instanceof IdempotencyInProgressError) {
    return new HttpError(
      409,
      'idempotency_operation_in_progress',
      error.message
    )
  }

  return new HttpError(
    500,
    'internal_server_error',
    'Internal server error'
  )
}

function isBodyParserError(error: unknown, type: string): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    (
      error as Error & {
        type?: unknown
      }
    ).type === type
  )
}

function serializeError(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return error
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  }
}
