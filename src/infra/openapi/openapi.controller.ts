import type { Express, Request, RequestHandler, Response } from 'express'
import type { OpenApiDocument } from '~/infra/openapi/openapi.types'

import swaggerUi from 'swagger-ui-express'

import { Inject, Injectable } from '~/core/di'
import { OPENAPI_DOCUMENT_TOKEN } from '~/infra/openapi/openapi.tokens'

@Injectable()
export class OpenApiController {
  private readonly swaggerUiHandler: RequestHandler

  constructor(
    @Inject(OPENAPI_DOCUMENT_TOKEN)
    private readonly document: OpenApiDocument
  ) {
    this.swaggerUiHandler = swaggerUi.setup(this.document, {
      customSiteTitle: 'Notification Preferences Service API',
      swaggerOptions: {
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        persistAuthorization: false,
        tryItOutEnabled: true
      }
    })
  }

  register(app: Express): void {
    app.get('/docs/json', this.getDocument)
    app.use(
      '/docs',
      this.setSwaggerContentSecurityPolicy,
      ...swaggerUi.serve,
      this.swaggerUiHandler
    )
  }

  private readonly getDocument = (
    _request: Request,
    response: Response
  ): void => {
    response.status(200).json(this.document)
  }

  private readonly setSwaggerContentSecurityPolicy: RequestHandler = (
    _request,
    response,
    next
  ): void => {
    response.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'"
      ].join('; ')
    )

    next()
  }
}
