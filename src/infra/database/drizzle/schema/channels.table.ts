import { boolean, pgTable, text } from 'drizzle-orm/pg-core'
import {
  createdAt,
  id,
  updatedAt
} from '~/infra/database/drizzle/helpers/table.helpers'

export const channelsTable = pgTable('channels', {
  id: id(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt()
})
