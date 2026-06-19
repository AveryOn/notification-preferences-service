import { sql } from 'drizzle-orm'
import {
  check,
  pgTable,
  text,
  time,
  uniqueIndex,
  varchar
} from 'drizzle-orm/pg-core'
import {
  createdAt,
  id,
  updatedAt
} from '~/infra/database/drizzle/helpers/table.helpers'

export const quietHoursTable = pgTable(
  'quiet_hours',
  {
    id: id(),
    userId: text('user_id').notNull(),
    startTime: time('start_time', { precision: 0 }).notNull(),
    endTime: time('end_time', { precision: 0 }).notNull(),
    timezone: varchar('timezone', { length: 255 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [
    uniqueIndex('quiet_hours_user_unique').on(table.userId),
    check(
      'quiet_hours_timezone_not_blank_check',
      sql`char_length(btrim(${table.timezone})) > 0`
    )
  ]
)
