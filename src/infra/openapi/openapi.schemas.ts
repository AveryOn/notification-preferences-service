import type { OpenApiSchemaObject } from '~/infra/openapi/openapi.types'

import {
  schemaRef,
  zodToOpenApiSchema
} from '~/infra/openapi/openapi.helpers'
import {
  channelResponseSchema,
  createChannelBodySchema,
  updateChannelBodySchema
} from '~/modules/v1/channels/infra/http/channels.dto'
import {
  evaluateNotificationBodySchema,
  evaluationResponseSchema
} from '~/modules/v1/evaluation/infra/http/evaluation.dto'
import {
  createGlobalPolicyBodySchema,
  globalPolicyResponseSchema
} from '~/modules/v1/global-policies/infra/http/global-policies.dto'
import {
  createNotificationTypeBodySchema,
  notificationTypeResponseSchema,
  updateNotificationTypeBodySchema
} from '~/modules/v1/notification-types/infra/http/notification-types.dto'
import {
  resetPreferenceBodySchema,
  updatePreferenceBodySchema,
  userPreferenceResponseSchema
} from '~/modules/v1/preferences/infra/http/preferences.dto'
import {
  quietHoursResponseSchema,
  updateQuietHoursBodySchema
} from '~/modules/v1/quiet-hours/infra/http/quiet-hours.dto'

function objectSchema(
  properties: Record<string, unknown>,
  required: string[]
): OpenApiSchemaObject {
  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required
  }
}

function dataResponseSchema(
  resourceSchemaName: string
): OpenApiSchemaObject {
  return objectSchema(
    {
      data: schemaRef(resourceSchemaName)
    },
    ['data']
  )
}

function dataListResponseSchema(
  resourceSchemaName: string
): OpenApiSchemaObject {
  return objectSchema(
    {
      data: {
        type: 'array',
        items: schemaRef(resourceSchemaName)
      }
    },
    ['data']
  )
}

export const openApiSchemas: Record<string, OpenApiSchemaObject> = {
  ValidationIssue: {
    type: 'object',
    additionalProperties: true,
    required: ['code', 'path', 'message'],
    properties: {
      code: { type: 'string' },
      path: {
        type: 'array',
        items: {
          oneOf: [{ type: 'string' }, { type: 'integer' }]
        }
      },
      message: { type: 'string' }
    }
  },
  ErrorResponse: {
    type: 'object',
    additionalProperties: true,
    required: ['code', 'message'],
    properties: {
      code: { type: 'string' },
      message: { type: 'string' },
      issues: {
        type: 'array',
        items: schemaRef('ValidationIssue')
      }
    }
  },
  HealthResponse: objectSchema(
    {
      status: {
        type: 'string',
        enum: ['ok']
      }
    },
    ['status']
  ),

  CreateChannelRequest: zodToOpenApiSchema(
    createChannelBodySchema,
    'input'
  ),
  UpdateChannelRequest: {
    ...zodToOpenApiSchema(updateChannelBodySchema, 'input'),
    minProperties: 1
  },
  Channel: zodToOpenApiSchema(channelResponseSchema, 'output'),
  ChannelResponse: dataResponseSchema('Channel'),
  ChannelListResponse: dataListResponseSchema('Channel'),

  CreateNotificationTypeRequest: zodToOpenApiSchema(
    createNotificationTypeBodySchema,
    'input'
  ),
  UpdateNotificationTypeRequest: {
    ...zodToOpenApiSchema(updateNotificationTypeBodySchema, 'input'),
    minProperties: 1
  },
  NotificationType: zodToOpenApiSchema(
    notificationTypeResponseSchema,
    'output'
  ),
  NotificationTypeResponse: dataResponseSchema('NotificationType'),
  NotificationTypeListResponse: dataListResponseSchema('NotificationType'),

  CreateGlobalPolicyRequest: zodToOpenApiSchema(
    createGlobalPolicyBodySchema,
    'input'
  ),
  GlobalPolicy: zodToOpenApiSchema(globalPolicyResponseSchema, 'output'),
  GlobalPolicyResponse: dataResponseSchema('GlobalPolicy'),
  GlobalPolicyListResponse: dataListResponseSchema('GlobalPolicy'),

  UpdatePreferenceRequest: zodToOpenApiSchema(
    updatePreferenceBodySchema,
    'input'
  ),
  ResetPreferenceRequest: zodToOpenApiSchema(
    resetPreferenceBodySchema,
    'input'
  ),
  UserPreference: zodToOpenApiSchema(
    userPreferenceResponseSchema,
    'output'
  ),
  UserPreferenceResponse: dataResponseSchema('UserPreference'),
  UserPreferenceListResponse: dataListResponseSchema('UserPreference'),

  UpdateQuietHoursRequest: zodToOpenApiSchema(
    updateQuietHoursBodySchema,
    'input'
  ),
  QuietHours: zodToOpenApiSchema(quietHoursResponseSchema, 'output'),
  QuietHoursResponse: dataResponseSchema('QuietHours'),

  EvaluateNotificationRequest: zodToOpenApiSchema(
    evaluateNotificationBodySchema,
    'input'
  ),
  EvaluationResult: zodToOpenApiSchema(evaluationResponseSchema, 'output')
}
