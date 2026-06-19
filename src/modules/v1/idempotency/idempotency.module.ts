import type { DiProvider } from '~/core/di'
import { IdempotencyService } from '~/modules/v1/idempotency/domain/idempotency.service'
import { IdempotencyDrizzleRepository } from '~/modules/v1/idempotency/infra/persistence/idempotency.drizzle.repo'
import { IdempotencyRepositoryPort } from '~/modules/v1/idempotency/ports/idempotency.repo.port'
import { IdempotencyServicePort } from '~/modules/v1/idempotency/ports/idempotency.service.port'

export const idempotencyProviders: DiProvider[] = [
  {
    token: IdempotencyRepositoryPort,
    useClass: IdempotencyDrizzleRepository
  },
  { token: IdempotencyServicePort, useClass: IdempotencyService }
]
