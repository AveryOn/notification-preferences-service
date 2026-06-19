import type { Express, NextFunction, Request, Response } from 'express'
import { APP_HEADER_KEY } from '~/core/const'
import { Inject, Injectable } from '~/core/di/di.container'
import { idempotencyKeySchema } from '~/modules/v1/idempotency/infra/http/idempotency.dto'
import { IdempotencyServicePort } from '~/modules/v1/idempotency/ports/idempotency.service.port'
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
    private readonly service: QuietHoursServicePort,

    @Inject(IdempotencyServicePort)
    private readonly idempotencyService: IdempotencyServicePort
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
        response.status(404).json({
          code: 'quiet_hours_not_found'
        })
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

      const key = idempotencyKeySchema.safeParse(
        request.header(APP_HEADER_KEY['Idempotency-Key'])
      )

      if (!key.success) {
        response.status(400).json({
          code: 'idempotency_key_required',
          issues: key.error.issues
        })
        return
      }

      const result = await this.idempotencyService.execute(
        {
          userId: params.data.userId,
          operation: 'quiet-hours.update',
          idempotencyKey: key.data,
          payload: body.data
        },
        async () => {
          const quietHours = await this.service.update(
            params.data.userId,
            {
              startTime: body.data.startTime!,
              endTime: body.data.endTime!,
              timezone: body.data.timezone!
            }
          )

          return {
            statusCode: 200,
            body: { data: quietHours }
          }
        }
      )

      response
        .setHeader(
          APP_HEADER_KEY['Idempotency-Replayed'],
          String(result.replayed)
        )
        .status(result.statusCode)
        .json(result.body)
    } catch (error) {
      if (error instanceof QuietHoursValidationError) {
        response.status(400).json({
          code: 'invalid_quiet_hours',
          message: error.message
        })
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
        response.status(404).json({
          code: 'quiet_hours_not_found'
        })
        return
      }

      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
