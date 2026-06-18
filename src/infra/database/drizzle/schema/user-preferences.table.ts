import {
  boolean,
  pgTable,
  text,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'
import {
  updatedAt,
  createdAt,
  id
} from '~/infra/database/drizzle/helpers/table.helpers'
import { notificationTypesTable } from '~/infra/database/drizzle/schema'

export const userPreferencesTable = pgTable(
  'user_preferences',
  {
    id: id(),
    userId: text('user_id').notNull(),
    notificationTypeId: uuid('notification_type_id')
      .notNull()
      .references(() => notificationTypesTable.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade'
      }),
    channel: text('channel').notNull(),
    enabled: boolean('enabled').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (t) => [
    uniqueIndex('up_user_type_channel_unique').on(
      t.userId,
      t.notificationTypeId,
      t.channel
    )
  ]
)
