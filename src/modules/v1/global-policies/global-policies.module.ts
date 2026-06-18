import type { DiProvider } from '~/core/di/types'
import { GlobalPoliciesService } from '~/modules/v1/global-policies/domain/global-policies.service'
import { GlobalPoliciesController } from '~/modules/v1/global-policies/infra/http/global-policies.controller'
import { GlobalPoliciesDrizzleRepository } from '~/modules/v1/global-policies/infra/persistence/global-policies.drizzle.repo'
import { GlobalPoliciesRepositoryPort } from '~/modules/v1/global-policies/ports/global-policies.repo.port'
import { GlobalPoliciesServicePort } from '~/modules/v1/global-policies/ports/global-policies.service.port'

export const globalPoliciesProviders: DiProvider[] = [
  {
    token: GlobalPoliciesRepositoryPort,
    useClass: GlobalPoliciesDrizzleRepository
  },
  { token: GlobalPoliciesServicePort, useClass: GlobalPoliciesService },
  { token: GlobalPoliciesController, useClass: GlobalPoliciesController }
]
