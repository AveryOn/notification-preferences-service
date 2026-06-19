## 1. Локальный запуск

Приложение работает на хосте, PostgreSQL — в Docker.

```bash
git clone https://github.com/AveryOn/notification-preferences-service.git
cd notification-preferences-service

nvm install
nvm use

npm ci

cp .env.example .env.development

sed -i 's/^POSTGRES_PORT=.*/POSTGRES_PORT=5433/' .env.development
sed -i 's|^DATABASE_URL=.*|DATABASE_URL=postgres://notification_service:notification_service@127.0.0.1:5433/notification_preferences|' .env.development

docker compose \
  --env-file .env.development \
  -f compose.development.yaml \
  up -d postgres

npm run db:migrate
npm run db:seed:test
npm run dev
```

## 2. Полный запуск через Docker

Приложение и PostgreSQL работают в Docker.

```bash
git clone https://github.com/AveryOn/notification-preferences-service.git
cd notification-preferences-service

nvm install
nvm use

npm ci

cp .env.example .env.development

sed -i 's/^POSTGRES_PORT=.*/POSTGRES_PORT=5433/' .env.development
sed -i 's|^DATABASE_URL=.*|DATABASE_URL=postgres://notification_service:notification_service@postgres:5432/notification_preferences|' .env.development

npm run dev:docker:up
```

Во втором терминале:

```bash
npm run db:migrate:development:docker
npm run db:seed:test
```

После запуска:

```text
API:         http://localhost:3000
Health:      http://localhost:3000/health
Swagger:     http://localhost:3000/docs
OpenAPI JSON: http://localhost:3000/docs/json
```
