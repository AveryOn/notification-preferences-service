import type { Express, NextFunction, Request, Response } from 'express'

import { APP_HEADER_KEY } from '~/core/const'
import { Inject, Injectable } from '~/core/di/di.container'
import { HttpError } from '~/infra/transport/http/http.error'
import { validateRequest } from '~/infra/transport/http/request.validator'
import { idempotencyKeySchema } from '~/modules/v1/idempotency/infra/http/idempotency.dto'
import { IdempotencyServicePort } from '~/modules/v1/idempotency/ports/idempotency.service.port'
import {
  quietHoursParamsSchema,
  toQuietHoursResponse,
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
      const params = validateRequest(
        quietHoursParamsSchema,
        request.params
      )
      const quietHours = await this.service.getByUserId(params.userId)

      if (!quietHours) {
        throw new HttpError(
          404,
          'quiet_hours_not_found',
          'Quiet hours were not found'
        )
      }

      response.status(200).json({ data: toQuietHoursResponse(quietHours) })
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
      const params = validateRequest(
        quietHoursParamsSchema,
        request.params
      )
      const body = validateRequest(
        updateQuietHoursBodySchema,
        request.body
      )
      const idempotencyKey = this.getIdempotencyKey(request)
      const result = await this.idempotencyService.execute(
        {
          userId: params.userId,
          operation: 'quiet-hours.update',
          idempotencyKey,
          payload: body
        },
        async () => {
          const quietHours = await this.service.update(params.userId, body)

          return {
            statusCode: 200,
            body: { data: toQuietHoursResponse(quietHours) }
          }
        }
      )

      this.sendIdempotentResponse(response, result)
    } catch (error) {
      next(error)
    }
  }

  private readonly remove = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = validateRequest(
        quietHoursParamsSchema,
        request.params
      )
      const idempotencyKey = this.getIdempotencyKey(request)
      const result = await this.idempotencyService.execute(
        {
          userId: params.userId,
          operation: 'quiet-hours.delete',
          idempotencyKey,
          payload: {}
        },
        async () => {
          const deleted = await this.service.remove(params.userId)

          if (!deleted) {
            throw new HttpError(
              404,
              'quiet_hours_not_found',
              'Quiet hours were not found'
            )
          }

          return { statusCode: 204, body: null }
        }
      )

      this.sendIdempotentResponse(response, result)
    } catch (error) {
      next(error)
    }
  }

  private getIdempotencyKey(request: Request): string {
    return validateRequest(
      idempotencyKeySchema,
      request.header(APP_HEADER_KEY['Idempotency-Key']),
      'idempotency_key_required'
    )
  }

  private sendIdempotentResponse(
    response: Response,
    result: {
      statusCode: number
      body: unknown
      replayed: boolean
    }
  ): void {
    response
      .setHeader(
        APP_HEADER_KEY['Idempotency-Replayed'],
        String(result.replayed)
      )
      .status(result.statusCode)

    if (result.statusCode === 204) {
      response.send()
      return
    }

    response.json(result.body)
  }
}
