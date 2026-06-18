import type {
  QuietHours,
  UpdateQuietHoursInput
} from '~/modules/v1/quiet-hours/domain/quiet-hours.types'

export abstract class QuietHoursServicePort {
  abstract getByUserId(userId: string): Promise<QuietHours | null>
  abstract update(
    userId: string,
    input: UpdateQuietHoursInput
  ): Promise<QuietHours>
  abstract remove(userId: string): Promise<boolean>
}
