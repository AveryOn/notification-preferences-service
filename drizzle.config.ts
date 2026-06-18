import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'
import { z } from 'zod'

const environment = process.env.NODE_ENV ?? 'development'

dotenv.config({ path: `.env.${environment}` })

const databaseUrl = z.url().parse(process.env.DATABASE_URL)

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infra/database/schema/**/*.ts',
  out: './drizzle',
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true
})
