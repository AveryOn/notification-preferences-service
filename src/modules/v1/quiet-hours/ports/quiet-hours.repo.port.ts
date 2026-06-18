import type {
  QuietHours,
  SaveQuietHoursInput
} from '~/modules/v1/quiet-hours/domain/quiet-hours.types'

export abstract class QuietHoursRepositoryPort {
  abstract findByUserId(userId: string): Promise<QuietHours | null>
  abstract upsert(input: SaveQuietHoursInput): Promise<QuietHours>
  abstract deleteByUserId(userId: string): Promise<boolean>
}
