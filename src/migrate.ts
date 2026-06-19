import { resolve } from 'node:path'

import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

import { env } from '~/env'
import { createDatabase } from '~/infra/database/drizzle'
import { logger } from '~/infra/logger/logger.factory'

const pool = new Pool({
  connectionString: env.DATABASE_URL
})

const database = createDatabase(pool)
const migrationsFolder = resolve(process.cwd(), 'drizzle')

try {
  logger.info({ migrationsFolder }, 'Starting database migrations')

  await migrate(database, { migrationsFolder })

  logger.info({}, 'Database migrations completed')
} catch (error) {
  logger.fatal({ error, migrationsFolder }, 'Database migrations failed')

  process.exitCode = 1
} finally {
  await pool.end()
}
