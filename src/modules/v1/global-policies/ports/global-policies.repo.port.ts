import type {
  CreateGlobalPolicyInput,
  GlobalPolicy,
  MatchGlobalPoliciesInput
} from '~/modules/v1/global-policies/domain/global-policies.types'

export abstract class GlobalPoliciesRepositoryPort {
  abstract create(
    input: CreateGlobalPolicyInput
  ): Promise<GlobalPolicy | null>
  abstract findAll(): Promise<GlobalPolicy[]>
  abstract findMatching(
    input: MatchGlobalPoliciesInput
  ): Promise<GlobalPolicy[]>
  abstract deleteById(id: string): Promise<boolean>
}
