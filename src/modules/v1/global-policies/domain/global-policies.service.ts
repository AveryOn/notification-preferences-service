import { Inject, Injectable } from '~/core/di/di.container'
import {
  type CreateGlobalPolicyInput,
  type GlobalPolicy,
  GlobalPolicyNotFoundError,
  GlobalPolicyReferenceNotFoundError,
  type MatchGlobalPoliciesInput
} from '~/modules/v1/global-policies/domain/global-policies.types'
import { GlobalPoliciesRepositoryPort } from '~/modules/v1/global-policies/ports/global-policies.repo.port'
import { GlobalPoliciesServicePort } from '~/modules/v1/global-policies/ports/global-policies.service.port'

@Injectable()
export class GlobalPoliciesService extends GlobalPoliciesServicePort {
  constructor(
    @Inject(GlobalPoliciesRepositoryPort)
    private readonly repository: GlobalPoliciesRepositoryPort
  ) {
    super()
  }

  async create(input: CreateGlobalPolicyInput): Promise<GlobalPolicy> {
    const policy = await this.repository.create(input)

    if (!policy) {
      throw new GlobalPolicyReferenceNotFoundError(
        'Notification type or channel was not found'
      )
    }

    return policy
  }

  getAll(): Promise<GlobalPolicy[]> {
    return this.repository.findAll()
  }

  getMatching(input: MatchGlobalPoliciesInput): Promise<GlobalPolicy[]> {
    return this.repository.findMatching(input)
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id)

    if (!deleted) {
      throw new GlobalPolicyNotFoundError(
        `Global policy was not found: ${id}`
      )
    }
  }
}
