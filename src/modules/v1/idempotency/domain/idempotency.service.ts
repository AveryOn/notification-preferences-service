import { createHash } from 'node:crypto'
import { Inject, Injectable } from '~/core/di/di.container'
import {
  type ExecuteIdempotentOperationInput,
  IdempotencyConflictError,
  type IdempotencyExecutionResult,
  IdempotencyInProgressError,
  type IdempotencyRecord,
  IdempotencyStateError,
  type IdempotentResponse
} from '~/modules/v1/idempotency/domain/idempotency.types'
import { IdempotencyRepositoryPort } from '~/modules/v1/idempotency/ports/idempotency.repo.port'
import { IdempotencyServicePort } from '~/modules/v1/idempotency/ports/idempotency.service.port'

const IDEMPOTENCY_TTL_MS = 7 * 24 * 60 * 60 * 1000

@Injectable()
export class IdempotencyService extends IdempotencyServicePort {
  constructor(
    @Inject(IdempotencyRepositoryPort)
    private readonly repository: IdempotencyRepositoryPort
  ) {
    super()
  }

  async execute<TBody>(
    input: ExecuteIdempotentOperationInput,
    handler: () => Promise<IdempotentResponse<TBody>>
  ): Promise<IdempotencyExecutionResult<TBody>> {
    const scope = {
      userId: input.userId,
      operation: input.operation,
      idempotencyKey: input.idempotencyKey
    }

    const requestHash = this.createRequestHash(input.payload)

    await this.repository.deleteExpiredByScope(scope, new Date())

    const existing = await this.repository.findByScope(scope)

    if (existing) {
      return this.resolveExisting<TBody>(existing, requestHash)
    }

    const record = await this.repository.createProcessing({
      ...scope,
      requestHash,
      expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS)
    })

    if (!record) {
      const concurrentRecord = await this.repository.findByScope(scope)

      if (!concurrentRecord) {
        throw new IdempotencyStateError(
          'Idempotency record was not created'
        )
      }

      return this.resolveExisting<TBody>(concurrentRecord, requestHash)
    }

    try {
      const result = await handler()

      await this.repository.complete({
        id: record.id,
        responseStatus: result.statusCode,
        responseBody: result.body
      })

      return { ...result, replayed: false }
    } catch (error) {
      await this.repository.deleteById(record.id)

      throw error
    }
  }

  private resolveExisting<TBody>(
    record: IdempotencyRecord,
    requestHash: string
  ): IdempotencyExecutionResult<TBody> {
    if (record.requestHash !== requestHash) {
      throw new IdempotencyConflictError()
    }

    if (record.status === 'processing') {
      throw new IdempotencyInProgressError()
    }

    if (record.responseStatus === null) {
      throw new IdempotencyStateError(
        'Completed idempotency record has no response'
      )
    }

    return {
      statusCode: record.responseStatus,
      body: record.responseBody as TBody,
      replayed: true
    }
  }

  private createRequestHash(payload: unknown): string {
    const normalized = this.normalize(payload)

    return createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex')
  }

  private normalize(value: unknown): unknown {
    if (value instanceof Date) {
      return value.toISOString()
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.normalize(item))
    }

    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, item]) => [key, this.normalize(item)])
      )
    }

    return value
  }
}
