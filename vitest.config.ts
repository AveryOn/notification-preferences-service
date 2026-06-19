import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 30_000,
    teardownTimeout: 30_000,

    env: {
      NODE_ENV: 'test',
      PORT: '3000',

      POSTGRES_USER: 'notification_service',
      POSTGRES_PASSWORD: 'notification_service',
      POSTGRES_DB: 'notification_preferences_test',
      POSTGRES_PORT: '5432',
      DATABASE_URL:
        'postgres://notification_service:notification_service@localhost:5432/notification_preferences_test',

      LOG_LEVEL: 'silent',
      LOG_PRETTY: 'false',
      CORS_ORIGINS: 'http://localhost:3000',
      TRUST_PROXY: 'false'
    }
  }
})
