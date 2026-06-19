import type { LoggerPort } from '~/shared/logger/logger.port'
import {
  type QuietHours,
  type UpdateQuietHoursInput
} from '~/modules/v1/quiet-hours/domain/quiet-hours.types'

import { LOGGER_TOKEN } from '~/app/app.tokens'
import { Inject, Injectable } from '~/core/di'
import { QuietHoursValidationError } from '~/modules/v1/quiet-hours/domain/quiet-hours.types'
import { QuietHoursRepositoryPort } from '~/modules/v1/quiet-hours/ports/quiet-hours.repo.port'
import { QuietHoursServicePort } from '~/modules/v1/quiet-hours/ports/quiet-hours.service.port'

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/

@Injectable()
export class QuietHoursService extends QuietHoursServicePort {
  constructor(
    @Inject(QuietHoursRepositoryPort)
    private readonly repository: QuietHoursRepositoryPort,

    @Inject(LOGGER_TOKEN)
    private readonly logger: LoggerPort
  ) {
    super()
  }

  getByUserId(userId: string): Promise<QuietHours | null> {
    return this.repository.findByUserId(userId)
  }

  async update(
    userId: string,
    input: UpdateQuietHoursInput
  ): Promise<QuietHours> {
    const current = await this.repository.findByUserId(userId)

    const startTime = input.startTime ?? current?.startTime
    const endTime = input.endTime ?? current?.endTime
    const timezone = input.timezone ?? current?.timezone

    if (!startTime || !endTime || !timezone) {
      throw new QuietHoursValidationError(
        'startTime, endTime and timezone are required for initial setup'
      )
    }

    this.validateTime(startTime, 'startTime')
    this.validateTime(endTime, 'endTime')
    this.validateTimezone(timezone)

    const quietHours = await this.repository.upsert({
      userId,
      startTime,
      endTime,
      timezone
    })

    this.logger.info(
      {
        event: current ? 'quiet_hours_updated' : 'quiet_hours_created',
        userId,
        previous: current
          ? {
              startTime: current.startTime,
              endTime: current.endTime,
              timezone: current.timezone
            }
          : null,
        current: {
          startTime: quietHours.startTime,
          endTime: quietHours.endTime,
          timezone: quietHours.timezone
        }
      },
      current ? 'Quiet hours updated' : 'Quiet hours created'
    )

    return quietHours
  }

  async remove(userId: string): Promise<boolean> {
    const deleted = await this.repository.deleteByUserId(userId)

    if (deleted) {
      this.logger.info(
        {
          event: 'quiet_hours_deleted',
          userId
        },
        'Quiet hours deleted'
      )
    }

    return deleted
  }

  private validateTime(value: string, field: string): void {
    if (!TIME_PATTERN.test(value)) {
      throw new QuietHoursValidationError(`${field} must use HH:mm format`)
    }
  }

  private validateTimezone(timezone: string): void {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(
        new Date()
      )
    } catch {
      throw new QuietHoursValidationError(
        'timezone must be a valid IANA timezone'
      )
    }
  }
}
