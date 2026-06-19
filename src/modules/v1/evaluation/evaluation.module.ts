import type { DiProvider } from '~/core/di'

import { EvaluationService } from '~/modules/v1/evaluation/domain/evaluation.service'
import { EvaluationController } from '~/modules/v1/evaluation/infra/http/evaluation.controller'
import { EvaluationServicePort } from '~/modules/v1/evaluation/ports/evaluation.service.port'

export const evaluationProviders: DiProvider[] = [
  { token: EvaluationServicePort, useClass: EvaluationService },
  { token: EvaluationController, useClass: EvaluationController }
]
