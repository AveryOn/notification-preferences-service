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
import { notificationTypesTable } from '~/infra/database/drizzle/schema/notification-types.table'

export const defaultPreferencesTable = pgTable(
  'default_preferences',
  {
    id: id(),

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
    uniqueIndex('dp_notification_type_channel_unique').on(
      table.notificationTypeId,
      table.channel
    )
  ]
)
