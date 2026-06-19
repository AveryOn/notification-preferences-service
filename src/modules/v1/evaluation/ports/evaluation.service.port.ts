import type {
  EvaluateNotificationInput,
  EvaluationResult
} from '~/modules/v1/evaluation/domain/evaluation.types'

export abstract class EvaluationServicePort {
  abstract evaluate(
    input: EvaluateNotificationInput
  ): Promise<EvaluationResult>
}
