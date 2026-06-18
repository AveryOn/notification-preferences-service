import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'

import {
  createdAt,
  id,
  updatedAt
} from '~/infra/database/drizzle/helpers/table.helpers'

export const idempotencyRecordsTable = pgTable(
  'idempotency_records',
  {
    id: id(),
    userId: text('user_id').notNull(),
    operation: text('operation').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    requestHash: text('request_hash').notNull(),
    status: text('status').notNull().default('processing'),
    responseStatus: integer('response_status'),
    responseBody: jsonb('response_body'),
    expiresAt: timestamp('expires_at', {
      withTimezone: true
    }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (t) => [
    unique('idempotency_records_scope_unique').on(
      t.userId,
      t.operation,
      t.idempotencyKey
    ),

    index('idempotency_records_expires_at_index').on(t.expiresAt)
  ]
)
