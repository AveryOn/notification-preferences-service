import { boolean, pgTable, unique, uuid } from 'drizzle-orm/pg-core'
import {
  updatedAt,
  createdAt,
  id
} from '~/infra/database/drizzle/helpers/table.helpers'
import {
  channelsTable,
  notificationTypesTable
} from '~/infra/database/drizzle/schema'

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
  (t) => [
    unique('default_preferences_notification_type_channel_unique').on(
      t.notificationTypeId,
      t.channelId
    )
  ]
)
