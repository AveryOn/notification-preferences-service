import type {
  ExecuteIdempotentOperationInput,
  IdempotencyExecutionResult,
  IdempotentResponse
} from '~/modules/v1/idempotency/domain/idempotency.types'

export abstract class IdempotencyServicePort {
  abstract execute<TBody>(
    input: ExecuteIdempotentOperationInput,
    handler: () => Promise<IdempotentResponse<TBody>>
  ): Promise<IdempotencyExecutionResult<TBody>>
}
