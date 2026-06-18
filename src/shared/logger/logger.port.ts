export type LogContext = Record<string, unknown>

export abstract class LoggerPort {
  abstract trace(context: LogContext, message: string): void
  abstract debug(context: LogContext, message: string): void
  abstract info(context: LogContext, message: string): void
  abstract warn(context: LogContext, message: string): void
  abstract error(context: LogContext, message: string): void
  abstract fatal(context: LogContext, message: string): void

  abstract child(bindings: LogContext): LoggerPort
}
