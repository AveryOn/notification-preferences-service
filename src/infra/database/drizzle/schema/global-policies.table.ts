import { pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'

import {
  createdAt,
  id,
  updatedAt
} from '~/infra/database/drizzle/helpers/table.helpers'
import { channelsTable } from '~/infra/database/drizzle/schema/channels.table'
import { notificationTypesTable } from '~/infra/database/drizzle/schema/notification-types.table'

export const globalPoliciesTable = pgTable(
  'global_policies',
  {
    id: id(),
    notificationTypeId: uuid('notification_type_id').references(
      () => notificationTypesTable.id,
      {
        onDelete: 'restrict',
        onUpdate: 'cascade'
      }
    ),
    channelId: uuid('channel_id').references(() => channelsTable.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade'
    }),
    region: text('region'),
    decision: text('decision').notNull(),
    reason: text('reason').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (t) => [
    unique('global_policies_rule_unique')
      .on(
        t.notificationTypeId,
        t.channelId,
        t.region,
        t.decision,
        t.reason
      )
      .nullsNotDistinct()
  ]
)
