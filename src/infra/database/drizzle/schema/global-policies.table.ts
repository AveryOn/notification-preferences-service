import { pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'

import {
  createdAt,
  id,
  updatedAt
} from '~/infra/database/drizzle/helpers/table.helpers'
import { notificationTypesTable } from '~/infra/database/drizzle/schema'

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
  (t) => [
    unique('global_policies_rule_unique')
      .on(t.notificationTypeId, t.channel, t.region, t.reason)
      .nullsNotDistinct()
  ]
)
