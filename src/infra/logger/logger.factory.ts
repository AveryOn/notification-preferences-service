import pino from 'pino'

import { env } from '~/env'
import { PinoLoggerAdapter } from '~/infra/logger/pino-logger.adapter'
import type { LoggerPort } from '~/infra/logger/logger.port'

const transport =
  env.NODE_ENV === 'development' && env.LOG_PRETTY
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      })
    : undefined

export const pinoLogger = pino(
  {
    level: env.LOG_LEVEL,

    base: {
      service: 'notification-preference-service',
      environment: env.NODE_ENV,
      pid: process.pid
    },

    redact: {
      paths: [
        'req.headers.authorization',
        'password',
        'token',
        'accessToken',
        'refreshToken'
      ],
      censor: '[REDACTED]'
    }
  },
  transport
)

export const logger: LoggerPort = new PinoLoggerAdapter(pinoLogger)
