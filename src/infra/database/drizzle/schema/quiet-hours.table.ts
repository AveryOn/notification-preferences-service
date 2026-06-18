import { pgTable, text, time, uniqueIndex } from 'drizzle-orm/pg-core'
import {
  updatedAt,
  createdAt,
  id
} from '~/infra/database/drizzle/helpers/table.helpers'

export const quietHoursTable = pgTable(
  'quiet_hours',
  {
    id: id(),
    userId: text('user_id').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    timezone: text('timezone').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (t) => [uniqueIndex('quiet_hours_user_unique').on(t.userId)]
)
