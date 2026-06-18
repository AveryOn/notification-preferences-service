import { drizzle } from 'drizzle-orm/node-postgres'
import type { Pool } from 'pg'
import * as schema from '~/infra/database/drizzle/schema'

export function createDatabase(pool: Pool) {
  return drizzle(pool, { schema })
}

export type Database = ReturnType<typeof createDatabase>
