import type { Express, NextFunction, Request, Response } from 'express'
import { Inject, Injectable } from '~/core/di/di.container'
import { QuietHoursValidationError } from '~/modules/v1/quiet-hours/domain/quiet-hours.types'
import {
  quietHoursParamsSchema,
  updateQuietHoursBodySchema
} from '~/modules/v1/quiet-hours/infra/http/quiet-hours.dto'
import { QuietHoursServicePort } from '~/modules/v1/quiet-hours/ports/quiet-hours.service.port'

@Injectable()
export class QuietHoursController {
  constructor(
    @Inject(QuietHoursServicePort)
    private readonly service: QuietHoursServicePort
  ) {}

  register(app: Express): void {
    app.get('/v1/users/:userId/quiet-hours', this.getByUserId)
    app.patch('/v1/users/:userId/quiet-hours', this.update)
    app.delete('/v1/users/:userId/quiet-hours', this.remove)
  }

  private readonly getByUserId = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = quietHoursParamsSchema.safeParse(request.params)

      if (!params.success) {
        response
          .status(400)
          .json({ code: 'invalid_request', issues: params.error.issues })
        return
      }

      const quietHours = await this.service.getByUserId(params.data.userId)

      if (!quietHours) {
        response.status(404).json({ code: 'quiet_hours_not_found' })
        return
      }

      response.status(200).json({ data: quietHours })
    } catch (error) {
      next(error)
    }
  }

  private readonly update = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = quietHoursParamsSchema.safeParse(request.params)
      const body = updateQuietHoursBodySchema.safeParse(request.body)

      if (!params.success || !body.success) {
        response.status(400).json({
          code: 'invalid_request',
          issues: [
            ...(params.success ? [] : params.error.issues),
            ...(body.success ? [] : body.error.issues)
          ]
        })
        return
      }

      const quietHours = await this.service.update(params.data.userId, {
        endTime: body.data.endTime!,
        startTime: body.data.startTime!,
        timezone: body.data.timezone!
      })

      response.status(200).json({ data: quietHours })
    } catch (error) {
      if (error instanceof QuietHoursValidationError) {
        response
          .status(400)
          .json({ code: 'invalid_quiet_hours', message: error.message })
        return
      }

      next(error)
    }
  }

  private readonly remove = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = quietHoursParamsSchema.safeParse(request.params)

      if (!params.success) {
        response
          .status(400)
          .json({ code: 'invalid_request', issues: params.error.issues })
        return
      }

      const deleted = await this.service.remove(params.data.userId)

      if (!deleted) {
        response.status(404).json({ code: 'quiet_hours_not_found' })
        return
      }

      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
