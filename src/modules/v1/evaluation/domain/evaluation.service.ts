import type { LoggerPort } from '~/shared/logger/logger.port'
import {
  type EvaluateNotificationInput,
  type EvaluationResult
} from '~/modules/v1/evaluation/domain/evaluation.types'

import { LOGGER_TOKEN } from '~/app/app.tokens'
import { Inject, Injectable } from '~/core/di'
import { EvaluationPreferenceNotFoundError } from '~/modules/v1/evaluation/domain/evaluation.types'
import { EvaluationServicePort } from '~/modules/v1/evaluation/ports/evaluation.service.port'
import { GlobalPoliciesServicePort } from '~/modules/v1/global-policies/ports/global-policies.service.port'
import { PreferencesServicePort } from '~/modules/v1/preferences/ports/preferences.service.port'
import { QuietHoursServicePort } from '~/modules/v1/quiet-hours/ports/quiet-hours.service.port'

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
      notificationType: input.notificationType,
      channel: input.channel,
      region: input.region
    })

    const deniedPolicies = policies.filter(
      (policy) => policy.decision === 'deny'
    )

    if (deniedPolicies.length > 0) {
      return this.complete(input, {
        decision: 'deny',
        reasons: [
          ...new Set(deniedPolicies.map((policy) => policy.reason))
        ]
      })
    }

    const preferences = await this.preferencesService.getByUserId(
      input.userId
    )

    const preference = preferences.find(
      (item) =>
        item.notificationTypeCode === input.notificationType &&
        item.channelCode === input.channel
    )

    if (!preference) {
      throw new EvaluationPreferenceNotFoundError(
        input.notificationType,
        input.channel
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
        reasons: ['allowed']
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
      reasons: ['allowed']
    })
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
        notificationType: input.notificationType,
        channel: input.channel,
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
