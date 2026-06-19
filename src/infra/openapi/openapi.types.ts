export type OpenApiHttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'options'
  | 'head'
  | 'trace'

export interface OpenApiReferenceObject {
  $ref: string
}

export type OpenApiSchemaObject = Record<string, unknown>
export type OpenApiSchema = OpenApiSchemaObject | OpenApiReferenceObject

export interface OpenApiMediaTypeObject {
  schema?: OpenApiSchema
  example?: unknown
}

export type OpenApiContentObject = Record<string, OpenApiMediaTypeObject>

export interface OpenApiParameterObject {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required?: boolean
  schema?: OpenApiSchema
}

export interface OpenApiHeaderObject {
  description?: string
  required?: boolean
  schema?: OpenApiSchema
}

export interface OpenApiRequestBodyObject {
  description?: string
  required?: boolean
  content: OpenApiContentObject
}

export interface OpenApiResponseObject {
  description: string
  headers?: Record<string, OpenApiHeaderObject | OpenApiReferenceObject>
  content?: OpenApiContentObject
}

export interface OpenApiOperationObject {
  tags?: string[]
  summary: string
  description?: string
  operationId: string
  parameters?: Array<OpenApiParameterObject | OpenApiReferenceObject>
  requestBody?: OpenApiRequestBodyObject | OpenApiReferenceObject
  responses: Record<string, OpenApiResponseObject | OpenApiReferenceObject>
}

export type OpenApiPathItemObject = Partial<
  Record<OpenApiHttpMethod, OpenApiOperationObject>
>

export type OpenApiPathsObject = Record<string, OpenApiPathItemObject>

export interface OpenApiComponentsObject {
  schemas: Record<string, OpenApiSchemaObject>
  parameters: Record<string, OpenApiParameterObject>
  headers: Record<string, OpenApiHeaderObject>
  responses: Record<string, OpenApiResponseObject>
}

export interface OpenApiDocument {
  openapi: '3.1.0'
  jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema'
  info: {
    title: string
    version: string
    description?: string
  }
  servers?: Array<{
    url: string
    description?: string
  }>
  tags?: Array<{
    name: string
    description?: string
  }>
  paths: OpenApiPathsObject
  components: OpenApiComponentsObject
}
