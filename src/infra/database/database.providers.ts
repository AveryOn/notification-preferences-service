import { Pool } from 'pg'

import { ENV_TOKEN, LOGGER_TOKEN } from '~/app/app.tokens'
import type { env } from '~/env'
import { DatabasePort } from '~/infra/database/ports/database.port'
import type { DiProvider } from '~/core/di/types'
import type { Database } from '~/infra/database/drizzle/index'
import { DrizzleDatabaseAdapter } from '~/infra/database/database.adapter'
import { DATABASE_POOL_TOKEN } from '~/infra/database/database.tokens'
import type { LoggerPort } from '~/shared/logger/logger.port'

type Environment = typeof env

export const databaseProviders: DiProvider[] = [
  {
    token: DATABASE_POOL_TOKEN,
    inject: [ENV_TOKEN, LOGGER_TOKEN],
    useFactory: (environment: Environment, logger: LoggerPort) => {
      const pool = new Pool({
        connectionString: environment.DATABASE_URL
      })

      pool.on('error', (error) => {
        logger.error(
          {
            error
          },
          'Unexpected PostgreSQL pool error'
        )
      })

      return pool
    }
  },
  {
    token: DatabasePort,
    inject: [DATABASE_POOL_TOKEN],
    useFactory: (pool: Pool): DatabasePort<Database> => {
      return new DrizzleDatabaseAdapter(pool)
    }
  }
]
