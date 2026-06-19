import { sql } from 'drizzle-orm'
import { check, pgTable, unique, uuid, varchar } from 'drizzle-orm/pg-core'

import {
  createdAt,
  id,
  updatedAt
} from '~/infra/database/drizzle/helpers/table.helpers'
import { channelsTable } from '~/infra/database/drizzle/schema/channels.table'
import { globalPolicyDecisionEnum } from '~/infra/database/drizzle/schema/enums'
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
    region: varchar('region', { length: 100 }),
    decision: globalPolicyDecisionEnum('decision').notNull(),
    reason: varchar('reason', { length: 255 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [
    unique('global_policies_scope_unique')
      .on(table.notificationTypeId, table.channelId, table.region)
      .nullsNotDistinct(),
    check(
      'global_policies_region_not_blank_check',
      sql`${table.region} IS NULL OR char_length(btrim(${table.region})) > 0`
    ),
    check(
      'global_policies_reason_not_blank_check',
      sql`char_length(btrim(${table.reason})) > 0`
    )
  ]
)
