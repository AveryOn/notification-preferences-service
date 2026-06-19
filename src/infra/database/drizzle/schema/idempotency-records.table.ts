import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  varchar
} from 'drizzle-orm/pg-core'

import {
  createdAt,
  id,
  updatedAt
} from '~/infra/database/drizzle/helpers/table.helpers'
import { idempotencyStatusEnum } from '~/infra/database/drizzle/schema/enums'

export const idempotencyRecordsTable = pgTable(
  'idempotency_records',
  {
    id: id(),
    userId: text('user_id').notNull(),
    operation: varchar('operation', { length: 100 }).notNull(),
    idempotencyKey: varchar('idempotency_key', {
      length: 255
    }).notNull(),
    requestHash: varchar('request_hash', { length: 64 }).notNull(),
    status: idempotencyStatusEnum('status')
      .notNull()
      .default('processing'),
    responseStatus: integer('response_status'),
    responseBody: jsonb('response_body'),
    expiresAt: timestamp('expires_at', {
      withTimezone: true
    }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [
    unique('idempotency_records_scope_unique').on(
      table.userId,
      table.operation,
      table.idempotencyKey
    ),
    index('idempotency_records_expires_at_index').on(table.expiresAt)
  ]
)
