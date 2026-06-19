export type IdempotencyStatus = 'processing' | 'completed'

export interface IdempotencyRecord {
  id: string
  userId: string
  operation: string
  idempotencyKey: string
  requestHash: string
  status: IdempotencyStatus
  responseStatus: number | null
  responseBody: unknown | null
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface IdempotencyScope {
  userId: string
  operation: string
  idempotencyKey: string
}

export interface CreateIdempotencyRecordInput extends IdempotencyScope {
  requestHash: string
  expiresAt: Date
}

export interface CompleteIdempotencyRecordInput {
  id: string
  responseStatus: number
  responseBody: unknown
}

export interface ExecuteIdempotentOperationInput {
  userId: string
  operation: string
  idempotencyKey: string
  payload: unknown
}

export interface IdempotentResponse<TBody> {
  statusCode: number
  body: TBody
}

export interface IdempotencyExecutionResult<
  TBody
> extends IdempotentResponse<TBody> {
  replayed: boolean
}

export class IdempotencyConflictError extends Error {
  override readonly name = 'IdempotencyConflictError'

  constructor() {
    super('Idempotency key was already used with another payload')
  }
}

export class IdempotencyInProgressError extends Error {
  override readonly name = 'IdempotencyInProgressError'

  constructor() {
    super('Operation with this idempotency key is processing')
  }
}

export class IdempotencyStateError extends Error {
  override readonly name = 'IdempotencyStateError'
}
