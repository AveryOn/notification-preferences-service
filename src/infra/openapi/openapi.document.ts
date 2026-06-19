import type { OpenApiDocument } from '~/infra/openapi/openapi.types'

import {
  openApiHeaders,
  openApiParameters,
  openApiResponses
} from '~/infra/openapi/openapi.components'
import { openApiPaths } from '~/infra/openapi/openapi.paths'
import { openApiSchemas } from '~/infra/openapi/openapi.schemas'

export function createOpenApiDocument(): OpenApiDocument {
  return {
    openapi: '3.1.0',
    jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema',
    info: {
      title: 'Notification Preferences Service API',
      version: '1.0.0',
      description:
        'API for managing notification channels, notification types, global policies, user preferences, quiet hours, and notification delivery decisions.'
    },
    servers: [
      {
        url: '/',
        description: 'Current server'
      }
    ],
    tags: [
      { name: 'System' },
      { name: 'Channels' },
      { name: 'Notification Types' },
      { name: 'Global Policies' },
      { name: 'User Preferences' },
      { name: 'Quiet Hours' },
      { name: 'Evaluation' }
    ],
    paths: openApiPaths,
    components: {
      schemas: openApiSchemas,
      parameters: openApiParameters,
      headers: openApiHeaders,
      responses: openApiResponses
    }
  }
}
