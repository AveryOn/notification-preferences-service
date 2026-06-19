import { randomUUID } from 'node:crypto'

import pinoHttp from 'pino-http'

import { pinoLogger } from '~/infra/logger/logger.factory'

export const httpLoggerMiddleware = pinoHttp({
  logger: pinoLogger,

  genReqId(request, response) {
    const incomingRequestId = request.headers['x-request-id']

    const requestId =
      typeof incomingRequestId === 'string'
        ? incomingRequestId
        : randomUUID()

    response.setHeader('x-request-id', requestId)

    return requestId
  },

  customLogLevel(_request, response, error) {
    if (error || response.statusCode >= 500) {
      return 'error'
    }

    if (response.statusCode >= 400) {
      return 'warn'
    }

    return 'info'
  }
})
