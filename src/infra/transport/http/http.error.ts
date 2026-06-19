export type HttpErrorDetails = Record<string, unknown>

export class HttpError extends Error {
  override readonly name = 'HttpError'

  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: HttpErrorDetails
  ) {
    super(message)
  }
}
