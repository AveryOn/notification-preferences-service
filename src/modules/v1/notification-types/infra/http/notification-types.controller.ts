import type { Express, NextFunction, Request, Response } from 'express'

import { Inject, Injectable } from '~/core/di'
import { validateRequest } from '~/infra/transport/http/request.validator'
import {
  createNotificationTypeBodySchema,
  notificationTypeParamsSchema,
  toNotificationTypeResponse,
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

      response.status(200).json({
        data: notificationTypes.map(toNotificationTypeResponse)
      })
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
      const body = validateRequest(
        createNotificationTypeBodySchema,
        request.body
      )
      const notificationTypeEntity = await this.service.create(body)

      response.status(201).json({
        data: toNotificationTypeResponse(notificationTypeEntity)
      })
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
        notificationTypeParamsSchema,
        request.params
      )
      const body = validateRequest(
        updateNotificationTypeBodySchema,
        request.body
      )
      const notificationTypeEntity = await this.service.update(
        params.notificationTypeId,
        {
          ...(body.code !== undefined ? { code: body.code } : {}),
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.isTransactional !== undefined
            ? { isTransactional: body.isTransactional }
            : {}),
          ...(body.isActive !== undefined
            ? { isActive: body.isActive }
            : {})
        }
      )

      response.status(200).json({
        data: toNotificationTypeResponse(notificationTypeEntity)
      })
    } catch (error) {
      next(error)
    }
  }
}
