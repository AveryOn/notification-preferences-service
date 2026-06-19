import type { Express, NextFunction, Request, Response } from 'express'

import { Inject, Injectable } from '~/core/di'
import { validateRequest } from '~/infra/transport/http/request.validator'
import { evaluateNotificationBodySchema } from '~/modules/v1/evaluation/infra/http/evaluation.dto'
import { EvaluationServicePort } from '~/modules/v1/evaluation/ports/evaluation.service.port'

@Injectable()
export class EvaluationController {
  constructor(
    @Inject(EvaluationServicePort)
    private readonly service: EvaluationServicePort
  ) {}

  register(app: Express): void {
    app.post('/v1/evaluate', this.evaluate)
  }

  private readonly evaluate = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const body = validateRequest(
        evaluateNotificationBodySchema,
        request.body
      )

      const result = await this.service.evaluate({
        userId: body.userId,
        notificationType: body.notificationType,
        channel: body.channel,
        region: body.region,
        datetime: new Date(body.datetime)
      })

      response.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
}
