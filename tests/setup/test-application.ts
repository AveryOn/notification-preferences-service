import type { PostgresTestContext } from './postgres-test-container'

import { EvaluationService } from '~/modules/v1/evaluation/domain/evaluation.service'
import { GlobalPoliciesService } from '~/modules/v1/global-policies/domain/global-policies.service'
import { GlobalPoliciesDrizzleRepository } from '~/modules/v1/global-policies/infra/persistence/global-policies.drizzle.repo'
import { IdempotencyService } from '~/modules/v1/idempotency/domain/idempotency.service'
import { IdempotencyDrizzleRepository } from '~/modules/v1/idempotency/infra/persistence/idempotency.drizzle.repo'
import { PreferencesService } from '~/modules/v1/preferences/domain/preferences.service'
import { PreferencesDrizzleRepository } from '~/modules/v1/preferences/infra/persistence/preferences.drizzle.repo'
import { QuietHoursService } from '~/modules/v1/quiet-hours/domain/quiet-hours.service'
import { QuietHoursDrizzleRepository } from '~/modules/v1/quiet-hours/infra/persistence/quiet-hours.drizzle.repo'

import { TestLogger } from './test-logger'

export interface TestApplication {
  preferencesService: PreferencesService
  quietHoursService: QuietHoursService
  globalPoliciesService: GlobalPoliciesService
  evaluationService: EvaluationService
  idempotencyService: IdempotencyService
}

export function createTestApplication(
  context: PostgresTestContext
): TestApplication {
  const logger = new TestLogger()

  const preferencesService = new PreferencesService(
    new PreferencesDrizzleRepository(context.databaseAdapter),
    logger
  )
  const quietHoursService = new QuietHoursService(
    new QuietHoursDrizzleRepository(context.databaseAdapter),
    logger
  )
  const globalPoliciesService = new GlobalPoliciesService(
    new GlobalPoliciesDrizzleRepository(context.databaseAdapter)
  )
  const idempotencyService = new IdempotencyService(
    new IdempotencyDrizzleRepository(context.databaseAdapter)
  )
  const evaluationService = new EvaluationService(
    globalPoliciesService,
    preferencesService,
    quietHoursService,
    logger
  )

  return {
    preferencesService,
    quietHoursService,
    globalPoliciesService,
    evaluationService,
    idempotencyService
  }
}
