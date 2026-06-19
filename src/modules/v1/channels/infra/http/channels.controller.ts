import type { Express, NextFunction, Request, Response } from 'express'

import { Inject, Injectable } from '~/core/di'
import {
  ChannelCodeConflictError,
  ChannelNotFoundError
} from '~/modules/v1/channels/domain/channels.types'
import {
  channelParamsSchema,
  createChannelBodySchema,
  updateChannelBodySchema
} from '~/modules/v1/channels/infra/http/channels.dto'
import { ChannelsServicePort } from '~/modules/v1/channels/ports/channels.service.port'

@Injectable()
export class ChannelsController {
  constructor(
    @Inject(ChannelsServicePort)
    private readonly service: ChannelsServicePort
  ) {}

  register(app: Express): void {
    app.get('/v1/channels', this.getAll)
    app.post('/v1/channels', this.create)
    app.patch('/v1/channels/:channelId', this.update)
  }

  private readonly getAll = async (
    _request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const channels = await this.service.getAll()

      response.status(200).json({ data: channels })
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
      const body = createChannelBodySchema.safeParse(request.body)

      if (!body.success) {
        response
          .status(400)
          .json({ code: 'invalid_request', issues: body.error.issues })
        return
      }

      const channel = await this.service.create(body.data)

      response.status(201).json({ data: channel })
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
      const params = channelParamsSchema.safeParse(request.params)
      const body = updateChannelBodySchema.safeParse(request.body)

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

      const channel = await this.service.update(params.data.channelId, {
        code: body.data.code!,
        isActive: body.data.isActive!,
        name: body.data.name!
      })

      response.status(200).json({ data: channel })
    } catch (error) {
      this.handleError(error, response, next)
    }
  }

  private handleError(
    error: unknown,
    response: Response,
    next: NextFunction
  ): void {
    if (error instanceof ChannelNotFoundError) {
      response
        .status(404)
        .json({ code: 'channel_not_found', message: error.message })
      return
    }

    if (error instanceof ChannelCodeConflictError) {
      response
        .status(409)
        .json({ code: 'channel_code_conflict', message: error.message })
      return
    }

    next(error)
  }
}
