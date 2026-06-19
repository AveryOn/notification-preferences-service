import type { ZodType } from 'zod'
import type {
  OpenApiHeaderObject,
  OpenApiReferenceObject,
  OpenApiRequestBodyObject,
  OpenApiResponseObject,
  OpenApiSchemaObject
} from '~/infra/openapi/openapi.types'

import { z } from 'zod'

export function schemaRef(name: string): OpenApiReferenceObject {
  return { $ref: `#/components/schemas/${name}` }
}

export function parameterRef(name: string): OpenApiReferenceObject {
  return { $ref: `#/components/parameters/${name}` }
}

export function headerRef(name: string): OpenApiReferenceObject {
  return { $ref: `#/components/headers/${name}` }
}

export function responseRef(name: string): OpenApiReferenceObject {
  return { $ref: `#/components/responses/${name}` }
}

export function zodToOpenApiSchema(
  schema: ZodType,
  io: 'input' | 'output'
): OpenApiSchemaObject {
  const jsonSchema = z.toJSONSchema(schema, {
    target: 'draft-2020-12',
    io,
    unrepresentable: 'any'
  })
  const result: OpenApiSchemaObject = { ...jsonSchema }

  delete result.$schema

  return result
}

export function jsonRequestBody(
  schemaName: string,
  description?: string
): OpenApiRequestBodyObject {
  return {
    required: true,
    ...(description !== undefined ? { description } : {}),
    content: {
      'application/json': {
        schema: schemaRef(schemaName)
      }
    }
  }
}

export function jsonResponse(
  description: string,
  schemaName: string,
  headers?: Record<string, OpenApiHeaderObject | OpenApiReferenceObject>
): OpenApiResponseObject {
  return {
    description,
    ...(headers !== undefined ? { headers } : {}),
    content: {
      'application/json': {
        schema: schemaRef(schemaName)
      }
    }
  }
}

export function emptyResponse(
  description: string,
  headers?: Record<string, OpenApiHeaderObject | OpenApiReferenceObject>
): OpenApiResponseObject {
  return {
    description,
    ...(headers !== undefined ? { headers } : {})
  }
}
