import { boolean, pgTable, text } from 'drizzle-orm/pg-core'
import {
  updatedAt,
  createdAt,
  id
} from '~/infra/database/drizzle/helpers/table.helpers'

export const notificationTypesTable = pgTable('notification_types', {
  id: id(),
  // code используется как машинный айдишник типа уведомления
  code: text('code').notNull().unique(),
  // name - человекочитаемое имя типа уведомления
  name: text('name').notNull(),
  isTransactional: boolean('is_transactional').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt()
})
