import type { Express, NextFunction, Request, Response } from 'express'

import { Inject, Injectable } from '~/core/di'
import { validateRequest } from '~/infra/transport/http/request.validator'
import {
  channelParamsSchema,
  createChannelBodySchema,
  toChannelResponse,
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

      response.status(200).json({
        data: channels.map(toChannelResponse)
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
      const body = validateRequest(createChannelBodySchema, request.body)
      const channelEntity = await this.service.create(body)

      response.status(201).json({ data: toChannelResponse(channelEntity) })
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
      const params = validateRequest(channelParamsSchema, request.params)
      const body = validateRequest(updateChannelBodySchema, request.body)
      const channelEntity = await this.service.update(params.channelId, {
        ...(body.code !== undefined ? { code: body.code } : {}),
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {})
      })

      response.status(200).json({ data: toChannelResponse(channelEntity) })
    } catch (error) {
      next(error)
    }
  }
}
