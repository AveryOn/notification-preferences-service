import type { Express, NextFunction, Request, Response } from 'express'

import { APP_HEADER_KEY } from '~/core/const'
import { Inject, Injectable } from '~/core/di'
import { validateRequest } from '~/infra/transport/http/request.validator'
import { idempotencyKeySchema } from '~/modules/v1/idempotency/infra/http/idempotency.dto'
import { IdempotencyServicePort } from '~/modules/v1/idempotency/ports/idempotency.service.port'
import {
  preferencesParamsSchema,
  resetPreferenceBodySchema,
  updatePreferenceBodySchema
} from '~/modules/v1/preferences/infra/http/preferences.dto'
import { PreferencesServicePort } from '~/modules/v1/preferences/ports/preferences.service.port'

@Injectable()
export class PreferencesController {
  constructor(
    @Inject(PreferencesServicePort)
    private readonly service: PreferencesServicePort,

    @Inject(IdempotencyServicePort)
    private readonly idempotencyService: IdempotencyServicePort
  ) {}

  register(app: Express): void {
    app.post('/v1/users/:userId/preferences/initialize', this.initialize)
    app.get('/v1/users/:userId/preferences', this.getByUserId)
    app.patch('/v1/users/:userId/preferences', this.update)
    app.post('/v1/users/:userId/preferences/reset', this.reset)
  }

  private readonly initialize = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = validateRequest(
        preferencesParamsSchema,
        request.params
      )

      const idempotencyKey = validateRequest(
        idempotencyKeySchema,
        request.header(APP_HEADER_KEY['Idempotency-Key']),
        'idempotency_key_required'
      )

      const result = await this.idempotencyService.execute(
        {
          userId: params.userId,
          operation: 'preferences.initialize',
          idempotencyKey,
          payload: {}
        },
        async () => {
          const preferences = await this.service.initialize(params.userId)

          return {
            statusCode: 200,
            body: { data: preferences }
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
      next(error)
    }
  }

  private readonly getByUserId = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = validateRequest(
        preferencesParamsSchema,
        request.params
      )

      const preferences = await this.service.getByUserId(params.userId)

      response.status(200).json({ data: preferences })
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
        preferencesParamsSchema,
        request.params
      )

      const body = validateRequest(
        updatePreferenceBodySchema,
        request.body
      )

      const idempotencyKey = validateRequest(
        idempotencyKeySchema,
        request.header(APP_HEADER_KEY['Idempotency-Key']),
        'idempotency_key_required'
      )

      const result = await this.idempotencyService.execute(
        {
          userId: params.userId,
          operation: 'preferences.update',
          idempotencyKey,
          payload: body
        },
        async () => {
          const preference = await this.service.update(params.userId, body)

          return {
            statusCode: 200,
            body: { data: preference }
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
      next(error)
    }
  }

  private readonly reset = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = validateRequest(
        preferencesParamsSchema,
        request.params
      )

      const body = validateRequest(resetPreferenceBodySchema, request.body)

      const preference = await this.service.reset(params.userId, body)

      response.status(200).json({ data: preference })
    } catch (error) {
      next(error)
    }
  }
}
