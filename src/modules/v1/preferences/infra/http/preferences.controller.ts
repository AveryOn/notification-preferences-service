import type { Express, NextFunction, Request, Response } from 'express'
import { APP_HEADER_KEY } from '~/core/const'
import { Inject, Injectable } from '~/core/di'
import { idempotencyKeySchema } from '~/modules/v1/idempotency/infra/http/idempotency.dto'
import { IdempotencyServicePort } from '~/modules/v1/idempotency/ports/idempotency.service.port'
import {
  DefaultPreferenceNotFoundError,
  PreferenceReferenceNotFoundError,
  PreferencesNotInitializedError
} from '~/modules/v1/preferences/domain/preferences.types'
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
      const params = preferencesParamsSchema.safeParse(request.params)

      if (!params.success) {
        response
          .status(400)
          .json({ code: 'invalid_request', issues: params.error.issues })
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
          operation: 'preferences.initialize',
          idempotencyKey: key.data,
          payload: {}
        },
        async () => {
          const preferences = await this.service.initialize(
            params.data.userId
          )

          return { statusCode: 200, body: { data: preferences } }
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
      const params = preferencesParamsSchema.safeParse(request.params)

      if (!params.success) {
        response
          .status(400)
          .json({ code: 'invalid_request', issues: params.error.issues })
        return
      }

      const preferences = await this.service.getByUserId(
        params.data.userId
      )

      response.status(200).json({ data: preferences })
    } catch (error) {
      this.handleError(error, response, next)
    }
  }

  private readonly update = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = preferencesParamsSchema.safeParse(request.params)
      const body = updatePreferenceBodySchema.safeParse(request.body)

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

      const preference = await this.service.update(
        params.data.userId,
        body.data
      )

      response.status(200).json({ data: preference })
    } catch (error) {
      this.handleError(error, response, next)
    }
  }

  private readonly reset = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = preferencesParamsSchema.safeParse(request.params)
      const body = resetPreferenceBodySchema.safeParse(request.body)

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

      const preference = await this.service.reset(
        params.data.userId,
        body.data
      )

      response.status(200).json({ data: preference })
    } catch (error) {
      this.handleError(error, response, next)
    }
  }

  private handleError(
    error: unknown,
    response: Response,
    next: NextFunction
  ): void {
    if (error instanceof PreferencesNotInitializedError) {
      response.status(404).json({
        code: 'preferences_not_initialized',
        message: error.message
      })
      return
    }

    if (error instanceof PreferenceReferenceNotFoundError) {
      response.status(404).json({
        code: 'preference_reference_not_found',
        message: error.message
      })
      return
    }

    if (error instanceof DefaultPreferenceNotFoundError) {
      response.status(404).json({
        code: 'default_preference_not_found',
        message: error.message
      })
      return
    }

    next(error)
  }
}
