import type {
  CompleteIdempotencyRecordInput,
  CreateIdempotencyRecordInput,
  IdempotencyRecord,
  IdempotencyScope
} from '~/modules/v1/idempotency/domain/idempotency.types'

export abstract class IdempotencyRepositoryPort {
  abstract findByScope(
    scope: IdempotencyScope
  ): Promise<IdempotencyRecord | null>

  abstract createProcessing(
    input: CreateIdempotencyRecordInput
  ): Promise<IdempotencyRecord | null>

  abstract complete(input: CompleteIdempotencyRecordInput): Promise<void>

  abstract deleteExpiredByScope(
    scope: IdempotencyScope,
    now: Date
  ): Promise<void>

  abstract deleteById(id: string): Promise<void>
}
