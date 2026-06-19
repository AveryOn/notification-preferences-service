import type { DiProvider } from '~/core/di'

import { OpenApiController } from '~/infra/openapi/openapi.controller'
import { createOpenApiDocument } from '~/infra/openapi/openapi.document'
import { OPENAPI_DOCUMENT_TOKEN } from '~/infra/openapi/openapi.tokens'

export const openApiProviders: DiProvider[] = [
  {
    token: OPENAPI_DOCUMENT_TOKEN,
    useFactory: createOpenApiDocument
  },
  {
    token: OpenApiController,
    useClass: OpenApiController
  }
]
