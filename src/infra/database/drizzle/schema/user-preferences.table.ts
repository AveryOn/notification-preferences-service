import {
  boolean,
  pgTable,
  text,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'
import {
  createdAt,
  id,
  updatedAt
} from '~/infra/database/drizzle/helpers/table.helpers'
import { channelsTable } from '~/infra/database/drizzle/schema/channels.table'
import { notificationTypesTable } from '~/infra/database/drizzle/schema/notification-types.table'

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
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channelsTable.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade'
      }),
    enabled: boolean('enabled').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [
    uniqueIndex('up_user_type_channel_unique').on(
      table.userId,
      table.notificationTypeId,
      table.channelId
    )
  ]
)
