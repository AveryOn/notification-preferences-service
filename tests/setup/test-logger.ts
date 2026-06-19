import type { LogContext } from '../../src/infra/logger'
import { LoggerPort } from '../../src/infra/logger'

export class TestLogger extends LoggerPort {
  trace(_context: LogContext, _message: string): void {}
  debug(_context: LogContext, _message: string): void {}
  info(_context: LogContext, _message: string): void {}
  warn(_context: LogContext, _message: string): void {}
  error(_context: LogContext, _message: string): void {}
  fatal(_context: LogContext, _message: string): void {}

  child(_bindings: LogContext): LoggerPort {
    return this
  }
}
