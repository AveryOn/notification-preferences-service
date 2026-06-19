import type { Express, NextFunction, Request, Response } from 'express'

import { Inject, Injectable } from '~/core/di'
import {
  NotificationTypeCodeConflictError,
  NotificationTypeNotFoundError
} from '~/modules/v1/notification-types/domain/notification-types.types'
import {
  createNotificationTypeBodySchema,
  notificationTypeParamsSchema,
  updateNotificationTypeBodySchema
} from '~/modules/v1/notification-types/infra/http/notification-types.dto'
import { NotificationTypesServicePort } from '~/modules/v1/notification-types/ports/notification-types.service.port'

@Injectable()
export class NotificationTypesController {
  constructor(
    @Inject(NotificationTypesServicePort)
    private readonly service: NotificationTypesServicePort
  ) {}

  register(app: Express): void {
    app.get('/v1/notification-types', this.getAll)
    app.post('/v1/notification-types', this.create)
    app.patch('/v1/notification-types/:notificationTypeId', this.update)
  }

  private readonly getAll = async (
    _request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notificationTypes = await this.service.getAll()

      response.status(200).json({ data: notificationTypes })
    } catch (error) {
      next(error)
    }
  }

  private readonly create = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const body = createNotificationTypeBodySchema.safeParse(request.body)

      if (!body.success) {
        response
          .status(400)
          .json({ code: 'invalid_request', issues: body.error.issues })
        return
      }

      const notificationType = await this.service.create(body.data)

      response.status(201).json({ data: notificationType })
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
      const params = notificationTypeParamsSchema.safeParse(request.params)
      const body = updateNotificationTypeBodySchema.safeParse(request.body)

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

      const notificationType = await this.service.update(
        params.data.notificationTypeId,
        {
          code: body.data.code!,
          isActive: body.data.isActive!,
          isTransactional: body.data.isTransactional!,
          name: body.data.name!
        }
      )

      response.status(200).json({ data: notificationType })
    } catch (error) {
      this.handleError(error, response, next)
    }
  }

  private handleError(
    error: unknown,
    response: Response,
    next: NextFunction
  ): void {
    if (error instanceof NotificationTypeNotFoundError) {
      response.status(404).json({
        code: 'notification_type_not_found',
        message: error.message
      })
      return
    }

    if (error instanceof NotificationTypeCodeConflictError) {
      response.status(409).json({
        code: 'notification_type_code_conflict',
        message: error.message
      })
      return
    }

    next(error)
  }
}
