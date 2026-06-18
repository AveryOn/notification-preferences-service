import { pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'

import {
  createdAt,
  id,
  updatedAt
} from '~/infra/database/drizzle/helpers/table.helpers'
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

    channel: text('channel'),

    region: text('region'),

    reason: text('reason').notNull(),

    createdAt: createdAt(),

    updatedAt: updatedAt()
  },
  (table) => [
    unique('global_policies_rule_unique')
      .on(
        table.notificationTypeId,
        table.channel,
        table.region,
        table.reason
      )
      .nullsNotDistinct()
  ]
)
