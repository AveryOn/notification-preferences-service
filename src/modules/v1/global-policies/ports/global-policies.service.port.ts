import type {
  CreateGlobalPolicyInput,
  GlobalPolicy,
  MatchGlobalPoliciesInput
} from '~/modules/v1/global-policies/domain/global-policies.types'

export abstract class GlobalPoliciesServicePort {
  abstract create(input: CreateGlobalPolicyInput): Promise<GlobalPolicy>
  abstract getAll(): Promise<GlobalPolicy[]>
  abstract getMatching(
    input: MatchGlobalPoliciesInput
  ): Promise<GlobalPolicy[]>
  abstract remove(id: string): Promise<void>
}
