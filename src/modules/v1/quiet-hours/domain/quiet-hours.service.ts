import { Inject, Injectable } from '~/core/di'
import {
  type QuietHours,
  QuietHoursValidationError,
  type UpdateQuietHoursInput
} from '~/modules/v1/quiet-hours/domain/quiet-hours.types'
import { QuietHoursRepositoryPort } from '~/modules/v1/quiet-hours/ports/quiet-hours.repo.port'
import { QuietHoursServicePort } from '~/modules/v1/quiet-hours/ports/quiet-hours.service.port'

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/

@Injectable()
export class QuietHoursService extends QuietHoursServicePort {
  constructor(
    @Inject(QuietHoursRepositoryPort)
    private readonly repository: QuietHoursRepositoryPort
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

    return this.repository.upsert({ userId, startTime, endTime, timezone })
  }

  remove(userId: string): Promise<boolean> {
    return this.repository.deleteByUserId(userId)
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
