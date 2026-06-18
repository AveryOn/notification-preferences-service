import {
  boolean,
  pgTable,
  text,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'

import { notificationTypesTable } from '~/infra/database/drizzle/schema/notification-types.table'
import {
  updatedAt,
  createdAt,
  id
} from '~/infra/database/drizzle/helpers/table.helpers'

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
  (table) => [
    uniqueIndex('up_user_type_channel_unique').on(
      table.userId,
      table.notificationTypeId,
      table.channel
    )
  ]
)
