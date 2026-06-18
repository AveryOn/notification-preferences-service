import type { Express, NextFunction, Request, Response } from 'express'
import { Inject, Injectable } from '~/core/di/di.container'
import {
  GlobalPolicyNotFoundError,
  GlobalPolicyReferenceNotFoundError
} from '~/modules/v1/global-policies/domain/global-policies.types'
import {
  createGlobalPolicyBodySchema,
  globalPolicyParamsSchema
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

      response.status(200).json({ data: policies })
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
      const body = createGlobalPolicyBodySchema.safeParse(request.body)

      if (!body.success) {
        response
          .status(400)
          .json({ code: 'invalid_request', issues: body.error.issues })
        return
      }

      const policy = await this.service.create({
        decision: body.data.decision,
        reason: body.data.reason,
        channel: body.data.channel!,
        notificationType: body.data.notificationType!,
        region: body.data.region!
      })

      response.status(201).json({ data: policy })
    } catch (error) {
      if (error instanceof GlobalPolicyReferenceNotFoundError) {
        response.status(404).json({
          code: 'global_policy_reference_not_found',
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
      const params = globalPolicyParamsSchema.safeParse(request.params)

      if (!params.success) {
        response
          .status(400)
          .json({ code: 'invalid_request', issues: params.error.issues })
        return
      }

      await this.service.remove(params.data.policyId)

      response.status(204).send()
    } catch (error) {
      if (error instanceof GlobalPolicyNotFoundError) {
        response.status(404).json({
          code: 'global_policy_not_found',
          message: error.message
        })
        return
      }

      next(error)
    }
  }
}
