import type { Database } from '~/infra/database/drizzle'
import type {
  QuietHours,
  SaveQuietHoursInput
} from '~/modules/v1/quiet-hours/domain/quiet-hours.types'

import { eq } from 'drizzle-orm'
import { Inject, Injectable } from '~/core/di'
import { DatabasePort } from '~/infra/database'
import { quietHoursTable } from '~/infra/database/drizzle/schema/quiet-hours.table'
import { QuietHoursRepositoryPort } from '~/modules/v1/quiet-hours/ports/quiet-hours.repo.port'

@Injectable()
export class QuietHoursDrizzleRepository extends QuietHoursRepositoryPort {
  constructor(
    @Inject(DatabasePort)
    private readonly database: DatabasePort<Database>
  ) {
    super()
  }

  async findByUserId(userId: string): Promise<QuietHours | null> {
    const [record] = await this.database.client
      .select()
      .from(quietHoursTable)
      .where(eq(quietHoursTable.userId, userId))
      .limit(1)

    return record ?? null
  }

  async upsert(input: SaveQuietHoursInput): Promise<QuietHours> {
    const [record] = await this.database.client
      .insert(quietHoursTable)
      .values(input)
      .onConflictDoUpdate({
        target: quietHoursTable.userId,
        set: {
          startTime: input.startTime,
          endTime: input.endTime,
          timezone: input.timezone,
          updatedAt: new Date()
        }
      })
      .returning()

    if (!record) {
      throw new Error('Failed to save quiet hours')
    }

    return record
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const deleted = await this.database.client
      .delete(quietHoursTable)
      .where(eq(quietHoursTable.userId, userId))
      .returning({ id: quietHoursTable.id })

    return deleted.length > 0
  }
}
