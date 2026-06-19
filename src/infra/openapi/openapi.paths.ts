import type {
  OpenApiPathItemObject,
  OpenApiPathsObject,
  OpenApiResponseObject
} from '~/infra/openapi/openapi.types'

import {
  emptyResponse,
  headerRef,
  jsonRequestBody,
  jsonResponse,
  parameterRef,
  responseRef
} from '~/infra/openapi/openapi.helpers'

const commonErrors = {
  '400': responseRef('BadRequest'),
  '500': responseRef('InternalServerError')
}

const idempotentErrors = {
  ...commonErrors,
  '409': responseRef('Conflict')
}

const idempotencyResponseHeaders = {
  'Idempotency-Replayed': headerRef('IdempotencyReplayed')
}

function pathItem(value: OpenApiPathItemObject): OpenApiPathItemObject {
  return value
}

function idempotentJsonResponse(
  description: string,
  schemaName: string
): OpenApiResponseObject {
  return jsonResponse(description, schemaName, idempotencyResponseHeaders)
}

export const openApiPaths: OpenApiPathsObject = {
  '/health': pathItem({
    get: {
      tags: ['Система'],
      summary: 'Проверить состояние сервиса',
      operationId: 'getHealth',
      responses: {
        '200': jsonResponse(
          'Сервис работает корректно.',
          'HealthResponse'
        ),
        '500': responseRef('InternalServerError')
      }
    }
  }),

  '/v1/channels': pathItem({
    get: {
      tags: ['Каналы'],
      summary: 'Получить список каналов уведомлений',
      operationId: 'listChannels',
      responses: {
        '200': jsonResponse(
          'Список каналов уведомлений.',
          'ChannelListResponse'
        ),
        '500': responseRef('InternalServerError')
      }
    },
    post: {
      tags: ['Каналы'],
      summary: 'Создать канал уведомлений',
      operationId: 'createChannel',
      requestBody: jsonRequestBody('CreateChannelRequest'),
      responses: {
        '201': jsonResponse(
          'Канал уведомлений создан.',
          'ChannelResponse'
        ),
        ...commonErrors,
        '409': responseRef('Conflict')
      }
    }
  }),

  '/v1/channels/{channelId}': pathItem({
    patch: {
      tags: ['Каналы'],
      summary: 'Обновить канал уведомлений',
      operationId: 'updateChannel',
      parameters: [parameterRef('ChannelId')],
      requestBody: jsonRequestBody('UpdateChannelRequest'),
      responses: {
        '200': jsonResponse(
          'Канал уведомлений обновлён.',
          'ChannelResponse'
        ),
        ...commonErrors,
        '404': responseRef('NotFound'),
        '409': responseRef('Conflict')
      }
    }
  }),

  '/v1/notification-types': pathItem({
    get: {
      tags: ['Типы уведомлений'],
      summary: 'Получить список типов уведомлений',
      operationId: 'listNotificationTypes',
      responses: {
        '200': jsonResponse(
          'Список типов уведомлений.',
          'NotificationTypeListResponse'
        ),
        '500': responseRef('InternalServerError')
      }
    },
    post: {
      tags: ['Типы уведомлений'],
      summary: 'Создать тип уведомления',
      operationId: 'createNotificationType',
      requestBody: jsonRequestBody('CreateNotificationTypeRequest'),
      responses: {
        '201': jsonResponse(
          'Тип уведомления создан.',
          'NotificationTypeResponse'
        ),
        ...commonErrors,
        '409': responseRef('Conflict')
      }
    }
  }),

  '/v1/notification-types/{notificationTypeId}': pathItem({
    patch: {
      tags: ['Типы уведомлений'],
      summary: 'Обновить тип уведомления',
      operationId: 'updateNotificationType',
      parameters: [parameterRef('NotificationTypeId')],
      requestBody: jsonRequestBody('UpdateNotificationTypeRequest'),
      responses: {
        '200': jsonResponse(
          'Тип уведомления обновлён.',
          'NotificationTypeResponse'
        ),
        ...commonErrors,
        '404': responseRef('NotFound'),
        '409': responseRef('Conflict')
      }
    }
  }),

  '/v1/global-policies': pathItem({
    get: {
      tags: ['Глобальные политики'],
      summary: 'Получить список глобальных политик',
      operationId: 'listGlobalPolicies',
      responses: {
        '200': jsonResponse(
          'Список глобальных политик уведомлений.',
          'GlobalPolicyListResponse'
        ),
        '500': responseRef('InternalServerError')
      }
    },
    post: {
      tags: ['Глобальные политики'],
      summary: 'Создать глобальную политику',
      operationId: 'createGlobalPolicy',
      requestBody: jsonRequestBody('CreateGlobalPolicyRequest'),
      responses: {
        '201': jsonResponse(
          'Глобальная политика создана.',
          'GlobalPolicyResponse'
        ),
        ...commonErrors,
        '404': responseRef('NotFound')
      }
    }
  }),

  '/v1/global-policies/{policyId}': pathItem({
    delete: {
      tags: ['Глобальные политики'],
      summary: 'Удалить глобальную политику',
      operationId: 'deleteGlobalPolicy',
      parameters: [parameterRef('PolicyId')],
      responses: {
        '204': emptyResponse('Глобальная политика удалена.'),
        ...commonErrors,
        '404': responseRef('NotFound')
      }
    }
  }),

  '/v1/users/{userId}/preferences/initialize': pathItem({
    post: {
      tags: ['Пользовательские настройки'],
      summary:
        'Инициализировать настройки пользователя значениями по умолчанию',
      operationId: 'initializeUserPreferences',
      parameters: [parameterRef('UserId'), parameterRef('IdempotencyKey')],
      responses: {
        '200': idempotentJsonResponse(
          'Настройки пользователя инициализированы.',
          'UserPreferenceListResponse'
        ),
        ...idempotentErrors
      }
    }
  }),

  '/v1/users/{userId}/preferences': pathItem({
    get: {
      tags: ['Пользовательские настройки'],
      summary: 'Получить настройки пользователя',
      operationId: 'getUserPreferences',
      parameters: [parameterRef('UserId')],
      responses: {
        '200': jsonResponse(
          'Эффективные настройки пользователя.',
          'UserPreferenceListResponse'
        ),
        ...commonErrors,
        '404': responseRef('NotFound')
      }
    },
    patch: {
      tags: ['Пользовательские настройки'],
      summary: 'Обновить настройку пользователя',
      operationId: 'updateUserPreference',
      parameters: [parameterRef('UserId'), parameterRef('IdempotencyKey')],
      requestBody: jsonRequestBody('UpdatePreferenceRequest'),
      responses: {
        '200': idempotentJsonResponse(
          'Настройка пользователя обновлена.',
          'UserPreferenceResponse'
        ),
        ...idempotentErrors,
        '404': responseRef('NotFound')
      }
    }
  }),

  '/v1/users/{userId}/preferences/reset': pathItem({
    post: {
      tags: ['Пользовательские настройки'],
      summary: 'Сбросить настройку пользователя до значения по умолчанию',
      operationId: 'resetUserPreference',
      parameters: [parameterRef('UserId'), parameterRef('IdempotencyKey')],
      requestBody: jsonRequestBody('ResetPreferenceRequest'),
      responses: {
        '200': idempotentJsonResponse(
          'Настройка пользователя сброшена до значения по умолчанию.',
          'UserPreferenceResponse'
        ),
        ...idempotentErrors,
        '404': responseRef('NotFound')
      }
    }
  }),

  '/v1/users/{userId}/quiet-hours': pathItem({
    get: {
      tags: ['Часы тишины'],
      summary: 'Получить часы тишины пользователя',
      operationId: 'getUserQuietHours',
      parameters: [parameterRef('UserId')],
      responses: {
        '200': jsonResponse(
          'Настройки часов тишины пользователя.',
          'QuietHoursResponse'
        ),
        ...commonErrors,
        '404': responseRef('NotFound')
      }
    },
    patch: {
      tags: ['Часы тишины'],
      summary: 'Создать или обновить часы тишины пользователя',
      operationId: 'upsertUserQuietHours',
      parameters: [parameterRef('UserId'), parameterRef('IdempotencyKey')],
      requestBody: jsonRequestBody('UpdateQuietHoursRequest'),
      responses: {
        '200': idempotentJsonResponse(
          'Часы тишины пользователя сохранены.',
          'QuietHoursResponse'
        ),
        ...idempotentErrors
      }
    },
    delete: {
      tags: ['Часы тишины'],
      summary: 'Удалить часы тишины пользователя',
      operationId: 'deleteUserQuietHours',
      parameters: [parameterRef('UserId'), parameterRef('IdempotencyKey')],
      responses: {
        '204': emptyResponse(
          'Часы тишины пользователя удалены.',
          idempotencyResponseHeaders
        ),
        ...idempotentErrors,
        '404': responseRef('NotFound')
      }
    }
  }),

  '/v1/evaluate': pathItem({
    post: {
      tags: ['Проверка отправки'],
      summary: 'Проверить возможность отправки уведомления',
      operationId: 'evaluateNotification',
      requestBody: jsonRequestBody('EvaluateNotificationRequest'),
      responses: {
        '200': jsonResponse(
          'Результат проверки возможности отправки уведомления.',
          'EvaluationResult'
        ),
        ...commonErrors,
        '404': responseRef('NotFound')
      }
    }
  })
}
