import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({
  path: `.env.${process.env.NODE_ENV ?? 'development'}`
})

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive().max(65535),

  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive().max(65535),

  DATABASE_URL: z.url(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  LOG_PRETTY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  CORS_ORIGINS: z
    .string()
    .min(1, 'CORS_ORIGINS is required')
    .refine(
      (value) =>
        value.split(',').every((origin) => {
          const normalizedOrigin = origin.trim()

          if (normalizedOrigin === '*') {
            return true
          }

          return z.url().safeParse(normalizedOrigin).success
        }),
      'CORS_ORIGINS must contain valid comma-separated URLs or *'
    ),

  TRUST_PROXY: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true'),

  SWAGGER_URL: z.string().trim().startsWith('/').default('/docs'),
  SWAGGER_JSON_URL: z.string().trim().startsWith('/').default('/docs/json')
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Invalid environment variables:')

  console.error(z.prettifyError(result.error))

  process.exit(1)
}

export const env = result.data
