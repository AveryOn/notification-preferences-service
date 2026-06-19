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
      tags: ['System'],
      summary: 'Check service health',
      operationId: 'getHealth',
      responses: {
        '200': jsonResponse('The service is healthy.', 'HealthResponse'),
        '500': responseRef('InternalServerError')
      }
    }
  }),

  '/v1/channels': pathItem({
    get: {
      tags: ['Channels'],
      summary: 'List notification channels',
      operationId: 'listChannels',
      responses: {
        '200': jsonResponse(
          'Notification channels.',
          'ChannelListResponse'
        ),
        '500': responseRef('InternalServerError')
      }
    },
    post: {
      tags: ['Channels'],
      summary: 'Create a notification channel',
      operationId: 'createChannel',
      requestBody: jsonRequestBody('CreateChannelRequest'),
      responses: {
        '201': jsonResponse('Channel created.', 'ChannelResponse'),
        ...commonErrors,
        '409': responseRef('Conflict')
      }
    }
  }),

  '/v1/channels/{channelId}': pathItem({
    patch: {
      tags: ['Channels'],
      summary: 'Update a notification channel',
      operationId: 'updateChannel',
      parameters: [parameterRef('ChannelId')],
      requestBody: jsonRequestBody('UpdateChannelRequest'),
      responses: {
        '200': jsonResponse('Channel updated.', 'ChannelResponse'),
        ...commonErrors,
        '404': responseRef('NotFound'),
        '409': responseRef('Conflict')
      }
    }
  }),

  '/v1/notification-types': pathItem({
    get: {
      tags: ['Notification Types'],
      summary: 'List notification types',
      operationId: 'listNotificationTypes',
      responses: {
        '200': jsonResponse(
          'Notification types.',
          'NotificationTypeListResponse'
        ),
        '500': responseRef('InternalServerError')
      }
    },
    post: {
      tags: ['Notification Types'],
      summary: 'Create a notification type',
      operationId: 'createNotificationType',
      requestBody: jsonRequestBody('CreateNotificationTypeRequest'),
      responses: {
        '201': jsonResponse(
          'Notification type created.',
          'NotificationTypeResponse'
        ),
        ...commonErrors,
        '409': responseRef('Conflict')
      }
    }
  }),

  '/v1/notification-types/{notificationTypeId}': pathItem({
    patch: {
      tags: ['Notification Types'],
      summary: 'Update a notification type',
      operationId: 'updateNotificationType',
      parameters: [parameterRef('NotificationTypeId')],
      requestBody: jsonRequestBody('UpdateNotificationTypeRequest'),
      responses: {
        '200': jsonResponse(
          'Notification type updated.',
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
      tags: ['Global Policies'],
      summary: 'List global notification policies',
      operationId: 'listGlobalPolicies',
      responses: {
        '200': jsonResponse(
          'Global policies.',
          'GlobalPolicyListResponse'
        ),
        '500': responseRef('InternalServerError')
      }
    },
    post: {
      tags: ['Global Policies'],
      summary: 'Create a global notification policy',
      operationId: 'createGlobalPolicy',
      requestBody: jsonRequestBody('CreateGlobalPolicyRequest'),
      responses: {
        '201': jsonResponse(
          'Global policy created.',
          'GlobalPolicyResponse'
        ),
        ...commonErrors,
        '404': responseRef('NotFound')
      }
    }
  }),

  '/v1/global-policies/{policyId}': pathItem({
    delete: {
      tags: ['Global Policies'],
      summary: 'Delete a global notification policy',
      operationId: 'deleteGlobalPolicy',
      parameters: [parameterRef('PolicyId')],
      responses: {
        '204': emptyResponse('Global policy deleted.'),
        ...commonErrors,
        '404': responseRef('NotFound')
      }
    }
  }),

  '/v1/users/{userId}/preferences/initialize': pathItem({
    post: {
      tags: ['User Preferences'],
      summary: 'Initialize user preferences from defaults',
      operationId: 'initializeUserPreferences',
      parameters: [parameterRef('UserId'), parameterRef('IdempotencyKey')],
      responses: {
        '200': idempotentJsonResponse(
          'User preferences initialized.',
          'UserPreferenceListResponse'
        ),
        ...idempotentErrors
      }
    }
  }),

  '/v1/users/{userId}/preferences': pathItem({
    get: {
      tags: ['User Preferences'],
      summary: 'Get user preferences',
      operationId: 'getUserPreferences',
      parameters: [parameterRef('UserId')],
      responses: {
        '200': jsonResponse(
          'Effective user preferences.',
          'UserPreferenceListResponse'
        ),
        ...commonErrors,
        '404': responseRef('NotFound')
      }
    },
    patch: {
      tags: ['User Preferences'],
      summary: 'Update one user preference',
      operationId: 'updateUserPreference',
      parameters: [parameterRef('UserId'), parameterRef('IdempotencyKey')],
      requestBody: jsonRequestBody('UpdatePreferenceRequest'),
      responses: {
        '200': idempotentJsonResponse(
          'User preference updated.',
          'UserPreferenceResponse'
        ),
        ...idempotentErrors,
        '404': responseRef('NotFound')
      }
    }
  }),

  '/v1/users/{userId}/preferences/reset': pathItem({
    post: {
      tags: ['User Preferences'],
      summary: 'Reset one user preference to its default',
      operationId: 'resetUserPreference',
      parameters: [parameterRef('UserId'), parameterRef('IdempotencyKey')],
      requestBody: jsonRequestBody('ResetPreferenceRequest'),
      responses: {
        '200': idempotentJsonResponse(
          'User preference reset.',
          'UserPreferenceResponse'
        ),
        ...idempotentErrors,
        '404': responseRef('NotFound')
      }
    }
  }),

  '/v1/users/{userId}/quiet-hours': pathItem({
    get: {
      tags: ['Quiet Hours'],
      summary: 'Get user quiet hours',
      operationId: 'getUserQuietHours',
      parameters: [parameterRef('UserId')],
      responses: {
        '200': jsonResponse('User quiet hours.', 'QuietHoursResponse'),
        ...commonErrors,
        '404': responseRef('NotFound')
      }
    },
    patch: {
      tags: ['Quiet Hours'],
      summary: 'Create or update user quiet hours',
      operationId: 'upsertUserQuietHours',
      parameters: [parameterRef('UserId'), parameterRef('IdempotencyKey')],
      requestBody: jsonRequestBody('UpdateQuietHoursRequest'),
      responses: {
        '200': idempotentJsonResponse(
          'User quiet hours saved.',
          'QuietHoursResponse'
        ),
        ...idempotentErrors
      }
    },
    delete: {
      tags: ['Quiet Hours'],
      summary: 'Delete user quiet hours',
      operationId: 'deleteUserQuietHours',
      parameters: [parameterRef('UserId'), parameterRef('IdempotencyKey')],
      responses: {
        '204': emptyResponse(
          'User quiet hours deleted.',
          idempotencyResponseHeaders
        ),
        ...idempotentErrors,
        '404': responseRef('NotFound')
      }
    }
  }),

  '/v1/evaluate': pathItem({
    post: {
      tags: ['Evaluation'],
      summary: 'Evaluate whether a notification may be sent',
      operationId: 'evaluateNotification',
      requestBody: jsonRequestBody('EvaluateNotificationRequest'),
      responses: {
        '200': jsonResponse(
          'Notification delivery decision.',
          'EvaluationResult'
        ),
        ...commonErrors,
        '404': responseRef('NotFound')
      }
    }
  })
}
