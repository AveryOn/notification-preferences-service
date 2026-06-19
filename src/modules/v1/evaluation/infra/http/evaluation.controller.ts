import type { Express, NextFunction, Request, Response } from 'express'

import { Inject, Injectable } from '~/core/di'
import { EvaluationPreferenceNotFoundError } from '~/modules/v1/evaluation/domain/evaluation.types'
import { evaluateNotificationBodySchema } from '~/modules/v1/evaluation/infra/http/evaluation.dto'
import { EvaluationServicePort } from '~/modules/v1/evaluation/ports/evaluation.service.port'
import { PreferencesNotInitializedError } from '~/modules/v1/preferences/domain/preferences.types'

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
      const body = evaluateNotificationBodySchema.safeParse(request.body)

      if (!body.success) {
        response
          .status(400)
          .json({ code: 'invalid_request', issues: body.error.issues })
        return
      }

      const result = await this.service.evaluate({
        userId: body.data.userId,
        notificationType: body.data.notificationType,
        channel: body.data.channel,
        region: body.data.region,
        datetime: new Date(body.data.datetime)
      })

      response.status(200).json(result)
    } catch (error) {
      if (error instanceof PreferencesNotInitializedError) {
        response.status(404).json({
          code: 'preferences_not_initialized',
          message: error.message
        })
        return
      }

      if (error instanceof EvaluationPreferenceNotFoundError) {
        response
          .status(404)
          .json({ code: 'preference_not_found', message: error.message })
        return
      }

      next(error)
    }
  }
}
