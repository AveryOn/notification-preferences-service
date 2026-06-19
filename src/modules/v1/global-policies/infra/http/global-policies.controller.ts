import type { Express, NextFunction, Request, Response } from 'express'

import { Inject, Injectable } from '~/core/di/di.container'
import { validateRequest } from '~/infra/transport/http/request.validator'
import {
  createGlobalPolicyBodySchema,
  globalPolicyParamsSchema,
  toGlobalPolicyResponse
} from '~/modules/v1/global-policies/infra/http/global-policies.dto'
import { GlobalPoliciesServicePort } from '~/modules/v1/global-policies/ports/global-policies.service.port'

@Injectable()
export class GlobalPoliciesController {
  constructor(
    @Inject(GlobalPoliciesServicePort)
    private readonly service: GlobalPoliciesServicePort
  ) {}

  register(app: Express): void {
    app.get('/v1/global-policies', this.getAll)
    app.post('/v1/global-policies', this.create)
    app.delete('/v1/global-policies/:policyId', this.remove)
  }

  private readonly getAll = async (
    _request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const policies = await this.service.getAll()

      response.status(200).json({
        data: policies.map(toGlobalPolicyResponse)
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
        createGlobalPolicyBodySchema,
        request.body
      )
      const policy = await this.service.create({
        decision: body.decision,
        reason: body.reason,
        ...(body.notificationTypeId !== undefined
          ? { notificationTypeId: body.notificationTypeId }
          : {}),
        ...(body.channelId !== undefined
          ? { channelId: body.channelId }
          : {}),
        ...(body.region !== undefined ? { region: body.region } : {})
      })

      response.status(201).json({ data: toGlobalPolicyResponse(policy) })
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
        globalPolicyParamsSchema,
        request.params
      )

      await this.service.remove(params.policyId)

      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
