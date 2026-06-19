import type {
  OpenApiHeaderObject,
  OpenApiParameterObject,
  OpenApiResponseObject
} from '~/infra/openapi/openapi.types'

import { jsonResponse } from '~/infra/openapi/openapi.helpers'

export const openApiParameters: Record<string, OpenApiParameterObject> = {
  UserId: {
    name: 'userId',
    in: 'path',
    description: 'Идентификатор пользователя на уровне приложения.',
    required: true,
    schema: {
      type: 'string',
      minLength: 1
    }
  },
  ChannelId: {
    name: 'channelId',
    in: 'path',
    description: 'Идентификатор канала.',
    required: true,
    schema: {
      type: 'string',
      format: 'uuid'
    }
  },
  NotificationTypeId: {
    name: 'notificationTypeId',
    in: 'path',
    description: 'Идентификатор типа уведомления.',
    required: true,
    schema: {
      type: 'string',
      format: 'uuid'
    }
  },
  PolicyId: {
    name: 'policyId',
    in: 'path',
    description: 'Идентификатор глобальной политики.',
    required: true,
    schema: {
      type: 'string',
      format: 'uuid'
    }
  },
  IdempotencyKey: {
    name: 'Idempotency-Key',
    in: 'header',
    description:
      'Уникальный ключ, идентифицирующий мутацию. Повторное использование ключа с другим payload вернёт 409.',
    required: true,
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 255
    }
  }
}

export const openApiHeaders: Record<string, OpenApiHeaderObject> = {
  IdempotencyReplayed: {
    description:
      'Indicates whether the response was replayed from a completed idempotency record.',
    required: true,
    schema: {
      type: 'string',
      enum: ['true', 'false']
    }
  }
}

export const openApiResponses: Record<string, OpenApiResponseObject> = {
  BadRequest: jsonResponse('The request is invalid.', 'ErrorResponse'),
  NotFound: jsonResponse(
    'The requested resource was not found.',
    'ErrorResponse'
  ),
  Conflict: jsonResponse(
    'The request conflicts with the current state.',
    'ErrorResponse'
  ),
  InternalServerError: jsonResponse(
    'An unexpected server error occurred.',
    'ErrorResponse'
  )
}
