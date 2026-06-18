import type { Pool } from 'pg'

import { DatabasePort } from '~/infra/database/ports/database.port'
import { createDatabase, type Database } from '~/infra/database/drizzle'

export class DrizzleDatabaseAdapter extends DatabasePort<Database> {
  readonly client: Database

  constructor(private readonly pool: Pool) {
    super()

    this.client = createDatabase(pool)
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1')
  }

  async close(): Promise<void> {
    await this.pool.end()
  }
}
