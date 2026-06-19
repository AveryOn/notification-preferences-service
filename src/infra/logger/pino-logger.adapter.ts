import type { Logger as PinoLogger } from 'pino'

import type { LogContext, LoggerPort } from '~/infra/logger'

export class PinoLoggerAdapter implements LoggerPort {
  public constructor(private readonly logger: PinoLogger) {}

  public trace(context: LogContext, message: string): void {
    this.logger.trace(context, message)
  }

  public debug(context: LogContext, message: string): void {
    this.logger.debug(context, message)
  }

  public info(context: LogContext, message: string): void {
    this.logger.info(context, message)
  }

  public warn(context: LogContext, message: string): void {
    this.logger.warn(context, message)
  }

  public error(context: LogContext, message: string): void {
    this.logger.error(context, message)
  }

  public fatal(context: LogContext, message: string): void {
    this.logger.fatal(context, message)
  }

  public child(bindings: LogContext): LoggerPort {
    return new PinoLoggerAdapter(this.logger.child(bindings))
  }
}
