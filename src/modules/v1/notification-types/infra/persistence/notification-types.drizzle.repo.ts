import type { Database } from '~/infra/database/drizzle'
import type {
  CreateNotificationTypeInput,
  NotificationType,
  UpdateNotificationTypeInput
} from '~/modules/v1/notification-types/domain/notification-types.types'

import { eq } from 'drizzle-orm'
import { Inject, Injectable } from '~/core/di/di.container'
import { notificationTypesTable } from '~/infra/database/drizzle/schema/notification-types.table'
import { DatabasePort } from '~/infra/database/ports/database.port'
import { NotificationTypesRepositoryPort } from '~/modules/v1/notification-types/ports/notification-types.repo.port'

@Injectable()
export class NotificationTypesDrizzleRepository extends NotificationTypesRepositoryPort {
  constructor(
    @Inject(DatabasePort)
    private readonly db: DatabasePort<Database>
  ) {
    super()
  }

  findAll(): Promise<NotificationType[]> {
    return this.db.client
      .select()
      .from(notificationTypesTable)
      .orderBy(notificationTypesTable.code)
  }

  async findById(id: string): Promise<NotificationType | null> {
    const [record] = await this.db.client
      .select()
      .from(notificationTypesTable)
      .where(eq(notificationTypesTable.id, id))
      .limit(1)

    return record ?? null
  }

  async findByCode(code: string): Promise<NotificationType | null> {
    const [record] = await this.db.client
      .select()
      .from(notificationTypesTable)
      .where(eq(notificationTypesTable.code, code))
      .limit(1)

    return record ?? null
  }

  async create(
    input: CreateNotificationTypeInput
  ): Promise<NotificationType> {
    const [record] = await this.db.client
      .insert(notificationTypesTable)
      .values({
        code: input.code,
        name: input.name,
        isTransactional: input.isTransactional
      })
      .returning()

    if (!record) {
      throw new Error('Failed to create notification type')
    }

    return record
  }

  async update(
    id: string,
    input: UpdateNotificationTypeInput
  ): Promise<NotificationType | null> {
    const [record] = await this.db.client
      .update(notificationTypesTable)
      .set({
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.isTransactional !== undefined
          ? { isTransactional: input.isTransactional }
          : {}),
        ...(input.isActive !== undefined
          ? { isActive: input.isActive }
          : {}),
        updatedAt: new Date()
      })
      .where(eq(notificationTypesTable.id, id))
      .returning()

    return record ?? null
  }
}
