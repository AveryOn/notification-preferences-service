import { sql } from 'drizzle-orm'
import { boolean, check, pgTable, varchar } from 'drizzle-orm/pg-core'
import {
  createdAt,
  id,
  updatedAt
} from '~/infra/database/drizzle/helpers/table.helpers'

export const notificationTypesTable = pgTable(
  'notification_types',
  {
    id: id(),
    code: varchar('code', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    isTransactional: boolean('is_transactional').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [
    check(
      'notification_types_code_format_check',
      sql`${table.code} ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'`
    ),
    check(
      'notification_types_name_not_blank_check',
      sql`char_length(btrim(${table.name})) > 0`
    )
  ]
)
