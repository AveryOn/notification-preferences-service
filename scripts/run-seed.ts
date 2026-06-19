import fs from 'node:fs/promises'
import path from 'node:path'

import dotenv from 'dotenv'
import { Client } from 'pg'
import { z } from 'zod'

const environment = process.env.NODE_ENV ?? 'development'

dotenv.config({
  path: `.env.${environment}`,
  quiet: true
})

const envSchema = z.object({
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive()
})

const run = async (): Promise<void> => {
  const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT } =
    envSchema.parse(process.env)

  const seedPath = process.argv[2]

  if (!seedPath) {
    throw new Error(
      'Seed file path is required. Example: npm run db:seed:test'
    )
  }

  const absoluteSeedPath = path.resolve(process.cwd(), seedPath)
  const sql = await fs.readFile(absoluteSeedPath, 'utf8')

  const client = new Client({
    host: '127.0.0.1',
    port: POSTGRES_PORT,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB
  })

  await client.connect()

  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')

    console.log(`Seed completed: ${seedPath}`)
  } catch (error) {
    await client.query('ROLLBACK')

    throw error
  } finally {
    await client.end()
  }
}

run().catch((error: unknown) => {
  console.error('Seed failed:', error)
  process.exitCode = 1
})
