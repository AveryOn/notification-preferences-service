import type { LoggerPort } from '~/infra/logger'
import type {
  EvaluateNotificationInput,
  EvaluationDecision,
  EvaluationResult
} from '~/modules/v1/evaluation/domain/evaluation.types'
import type { GlobalPolicy } from '~/modules/v1/global-policies/domain/global-policies.types'

import { LOGGER_TOKEN } from '~/app/app.tokens'
import { Inject, Injectable } from '~/core/di'
import { EvaluationPreferenceNotFoundError } from '~/modules/v1/evaluation/domain/evaluation.types'
import { EvaluationServicePort } from '~/modules/v1/evaluation/ports/evaluation.service.port'
import { GlobalPoliciesServicePort } from '~/modules/v1/global-policies/ports/global-policies.service.port'
import { PreferencesServicePort } from '~/modules/v1/preferences/ports/preferences.service.port'
import { QuietHoursServicePort } from '~/modules/v1/quiet-hours/ports/quiet-hours.service.port'

interface PolicyResolution {
  decision: EvaluationDecision
  reasons: string[]
}

@Injectable()
export class EvaluationService extends EvaluationServicePort {
  constructor(
    @Inject(GlobalPoliciesServicePort)
    private readonly globalPoliciesService: GlobalPoliciesServicePort,

    @Inject(PreferencesServicePort)
    private readonly preferencesService: PreferencesServicePort,

    @Inject(QuietHoursServicePort)
    private readonly quietHoursService: QuietHoursServicePort,

    @Inject(LOGGER_TOKEN)
    private readonly logger: LoggerPort
  ) {
    super()
  }

  async evaluate(
    input: EvaluateNotificationInput
  ): Promise<EvaluationResult> {
    const policies = await this.globalPoliciesService.getMatching({
      notificationTypeId: input.notificationTypeId,
      channelId: input.channelId,
      region: input.region
    })
    const policyResolution = this.resolvePolicies(policies)

    if (policyResolution?.decision === 'deny') {
      return this.complete(input, policyResolution)
    }

    const preferences = await this.preferencesService.getByUserId(
      input.userId
    )
    const preference = preferences.find(
      (item) =>
        item.notificationTypeId === input.notificationTypeId &&
        item.channelId === input.channelId
    )

    if (!preference) {
      throw new EvaluationPreferenceNotFoundError(
        input.notificationTypeId,
        input.channelId
      )
    }

    if (!preference.enabled) {
      return this.complete(input, {
        decision: 'deny',
        reasons: ['disabled_by_preference']
      })
    }

    if (preference.isTransactional) {
      return this.complete(input, {
        decision: 'allow',
        reasons: this.resolveAllowReasons(policyResolution)
      })
    }

    const quietHours = await this.quietHoursService.getByUserId(
      input.userId
    )

    if (
      quietHours &&
      this.isInsideQuietHours(
        input.datetime,
        quietHours.startTime,
        quietHours.endTime,
        quietHours.timezone
      )
    ) {
      return this.complete(input, {
        decision: 'deny',
        reasons: ['blocked_by_quiet_hours']
      })
    }

    return this.complete(input, {
      decision: 'allow',
      reasons: this.resolveAllowReasons(policyResolution)
    })
  }

  private resolvePolicies(
    policies: GlobalPolicy[]
  ): PolicyResolution | null {
    if (policies.length === 0) {
      return null
    }

    const highestSpecificity = Math.max(
      ...policies.map((policy) => this.getPolicySpecificity(policy))
    )
    const highestPriorityPolicies = policies.filter(
      (policy) => this.getPolicySpecificity(policy) === highestSpecificity
    )
    const denyingPolicies = highestPriorityPolicies.filter(
      (policy) => policy.decision === 'deny'
    )
    const effectivePolicies =
      denyingPolicies.length > 0
        ? denyingPolicies
        : highestPriorityPolicies.filter(
            (policy) => policy.decision === 'allow'
          )

    return {
      decision: denyingPolicies.length > 0 ? 'deny' : 'allow',
      reasons: [
        ...new Set(effectivePolicies.map((policy) => policy.reason))
      ]
    }
  }

  private getPolicySpecificity(policy: GlobalPolicy): number {
    return [
      policy.notificationTypeId,
      policy.channelId,
      policy.region
    ].filter((value) => value !== null).length
  }

  private resolveAllowReasons(
    policyResolution: PolicyResolution | null
  ): string[] {
    if (policyResolution?.decision === 'allow') {
      return policyResolution.reasons
    }

    return ['allowed']
  }

  private isInsideQuietHours(
    datetime: Date,
    startTime: string,
    endTime: string,
    timezone: string
  ): boolean {
    const currentMinutes = this.getLocalMinutes(datetime, timezone)
    const startMinutes = this.parseTime(startTime)
    const endMinutes = this.parseTime(endTime)

    if (startMinutes === endMinutes) {
      return false
    }

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes
    }

    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }

  private getLocalMinutes(datetime: Date, timezone: string): number {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(datetime)

    const hour = Number(parts.find((part) => part.type === 'hour')?.value)
    const minute = Number(
      parts.find((part) => part.type === 'minute')?.value
    )

    return hour * 60 + minute
  }

  private parseTime(value: string): number {
    const [hour = '0', minute = '0'] = value.split(':')

    return Number(hour) * 60 + Number(minute)
  }

  private complete(
    input: EvaluateNotificationInput,
    result: EvaluationResult
  ): EvaluationResult {
    this.logger.info(
      {
        userId: input.userId,
        notificationTypeId: input.notificationTypeId,
        channelId: input.channelId,
        region: input.region,
        datetime: input.datetime.toISOString(),
        decision: result.decision,
        reasons: result.reasons
      },
      'Notification permission evaluated'
    )

    return result
  }
}
