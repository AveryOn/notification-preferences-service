import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer
} from '@testcontainers/postgresql'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

import { DrizzleDatabaseAdapter } from '~/infra/database/database.adapter'
import { createDatabase, type Database } from '~/infra/database/drizzle'

const SQL_STATEMENT_BREAKPOINT = '--> statement-breakpoint'

export interface PostgresTestContext {
  container: StartedPostgreSqlContainer
  pool: Pool
  database: Database
  databaseAdapter: DrizzleDatabaseAdapter
}

export async function startPostgresTestContainer(): Promise<PostgresTestContext> {
  const container = await new PostgreSqlContainer('postgres:17-bookworm')
    .withDatabase('notification_preferences_test')
    .withUsername('notification_service')
    .withPassword('notification_service')
    .start()

  const pool = new Pool({ connectionString: container.getConnectionUri() })
  const database = createDatabase(pool)
  const databaseAdapter = new DrizzleDatabaseAdapter(pool)

  await migrate(database, {
    migrationsFolder: resolve(process.cwd(), 'drizzle')
  })

  return { container, pool, database, databaseAdapter }
}

export async function resetPostgresTestDatabase(
  context: PostgresTestContext
): Promise<void> {
  await context.pool.query(`
    TRUNCATE TABLE
      idempotency_records,
      quiet_hours,
      user_preferences,
      global_policies,
      default_preferences,
      channels,
      notification_types
    CASCADE
  `)

  const seed = await readFile(
    resolve(process.cwd(), 'seeds/pg/test-data.seed.sql'),
    'utf8'
  )

  for (const statement of seed.split(SQL_STATEMENT_BREAKPOINT)) {
    const sql = statement.trim()

    if (sql.length > 0) {
      await context.pool.query(sql)
    }
  }
}

export async function stopPostgresTestContainer(
  context: PostgresTestContext
): Promise<void> {
  await context.databaseAdapter.close()
  await context.container.stop()
}
