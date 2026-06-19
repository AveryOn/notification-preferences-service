# Notification Preferences Service

## Getting Started

### Требования

Для локального запуска необходимы:

- Node.js `>= 24`;
- npm;
- Docker с доступным Docker daemon;
- PostgreSQL 17 — локально либо через Docker Compose.

Версия Node.js зафиксирована в `.nvmrc`.

```bash
nvm use
npm ci
```

### Быстрый локальный запуск

Наиболее простой вариант разработки: приложение запускается локально через Node.js, PostgreSQL — через Docker Compose.

1. Создать файл окружения:

```bash
cp .env.example .env.development
```

2. Указать в `.env.development` параметры локального подключения:

```dotenv
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
LOG_PRETTY=true
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
TRUST_PROXY=false

SWAGGER_URL="/docs"
SWAGGER_JSON_URL="/docs/json"

POSTGRES_USER=notification_service
POSTGRES_PASSWORD=notification_service
POSTGRES_DB=notification_preferences
POSTGRES_PORT=5433
DATABASE_URL=postgres://notification_service:notification_service@localhost:5433/notification_preferences
```

3. Запустить только PostgreSQL:

```bash
docker compose \
  --env-file .env.development \
  -f compose.development.yaml \
  up -d postgres
```

4. Применить миграции:

```bash
npm run db:migrate
```

5. Загрузить тестовые справочники, дефолты и глобальную политику:

```bash
npm run db:seed:test
```

6. Запустить приложение:

```bash
npm run dev
```

После запуска доступны:

- API: `http://localhost:3000`;
- Swagger UI: `http://localhost:3000/docs`;
- OpenAPI JSON: `http://localhost:3000/openapi.json`;
- Health check: `http://localhost:3000/health`.

Проверка:

```bash
curl http://localhost:3000/health
```

Ожидаемый ответ:

```json
{
  "status": "ok"
}
```

### Полный запуск через Docker Compose

Для запуска приложения и PostgreSQL внутри Docker в `.env.development` необходимо использовать имя Compose-сервиса `postgres` в `DATABASE_URL`:

```dotenv
NODE_ENV=development
PORT=3000
APP_PORT=3000
LOG_LEVEL=debug
LOG_PRETTY=true
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
TRUST_PROXY=false

SWAGGER_URL="/docs"
SWAGGER_JSON_URL="/docs/json"

SWAGGER_URL="/docs"
SWAGGER_JSON_URL="/docs/json"

POSTGRES_USER=notification_service
POSTGRES_PASSWORD=notification_service
POSTGRES_DB=notification_preferences
POSTGRES_PORT=5433
DATABASE_URL=postgres://notification_service:notification_service@postgres:5432/notification_preferences
```

Запуск:

```bash
npm run dev:docker:up
```

В отдельном терминале применить миграции:

```bash
npm run db:migrate:development:docker
```

Сид выполняется с хоста и подключается к `127.0.0.1:${POSTGRES_PORT}`:

```bash
npm run db:seed:test
```

Остановка:

```bash
npm run dev:docker:down
```

---

## Назначение сервиса

Notification Preferences Service является единым источником правды для определения допустимости отправки уведомлений пользователю.

Сервис хранит и применяет:

- каналы доставки уведомлений;
- типы уведомлений;
- дефолтные предпочтения;
- индивидуальные предпочтения пользователей;
- пользовательские quiet hours;
- глобальные политики по типу уведомления, каналу и региону;
- записи идемпотентности для команд изменения состояния.

Сервис не отправляет уведомления самостоятельно. Его ответственность — вернуть решение `allow` или `deny` и причины принятого решения.

`userId` является внешним идентификатором пользователя. Внутренняя таблица пользователей в сервисе отсутствует.

---

## Технологический стек

- TypeScript;
- Node.js 24;
- Express 5;
- PostgreSQL 17;
- Drizzle ORM и Drizzle Kit;
- Zod;
- Pino и `pino-http`;
- OpenAPI 3.1 и Swagger UI;
- Vitest;
- Testcontainers;
- Docker и Docker Compose;
- tsup;
- ESLint и Prettier.

---

## Архитектура

Проект разделён на доменный, транспортный и инфраструктурный уровни.

```text
src/
├── app/
│   ├── app.providers.ts
│   └── app.tokens.ts
├── core/
│   ├── const.ts
│   └── di/
├── infra/
│   ├── database/
│   ├── logger/
│   ├── openapi/
│   └── transport/http/
├── modules/v1/
│   ├── channels/
│   ├── notification-types/
│   ├── preferences/
│   ├── quiet-hours/
│   ├── global-policies/
│   ├── idempotency/
│   └── evaluation/
├── env.ts
├── main.ts
└── migrate.ts
```

Типовая структура бизнес-модуля:

```text
module/
├── domain/
│   ├── *.service.ts
│   └── *.types.ts
├── infra/
│   ├── http/
│   │   ├── *.controller.ts
│   │   └── *.dto.ts
│   └── persistence/
│       └── *.drizzle.repo.ts
├── ports/
│   ├── *.repo.port.ts
│   └── *.service.port.ts
└── *.module.ts
```

### Ответственность слоёв

`domain` содержит бизнес-правила, доменные типы и доменные ошибки.

`ports` определяет абстракции сервисов и репозиториев. Домен зависит от портов, а не от Express, PostgreSQL или Drizzle.

`infra/http` содержит HTTP-контроллеры, Zod DTO, преобразование доменных сущностей в API-ответы и регистрацию маршрутов.

`infra/persistence` содержит реализации репозиториев на Drizzle ORM.

`infra/database` создаёт PostgreSQL pool, Drizzle client и адаптер `DatabasePort`.

`infra/openapi` формирует OpenAPI-документ и публикует `/docs` и `/openapi.json`.

### Связи модулей

```text
HttpServer
├── ChannelsController
│   └── ChannelsServicePort
│       └── ChannelsRepoPort
│           └── DatabasePort
├── NotificationTypesController
│   └── NotificationTypesServicePort
│       └── NotificationTypesRepositoryPort
│           └── DatabasePort
├── PreferencesController
│   ├── PreferencesServicePort
│   │   ├── PreferencesRepositoryPort
│   │   │   └── DatabasePort
│   │   └── LoggerPort
│   └── IdempotencyServicePort
│       └── IdempotencyRepositoryPort
│           └── DatabasePort
├── QuietHoursController
│   ├── QuietHoursServicePort
│   │   ├── QuietHoursRepositoryPort
│   │   │   └── DatabasePort
│   │   └── LoggerPort
│   └── IdempotencyServicePort
├── GlobalPoliciesController
│   └── GlobalPoliciesServicePort
│       └── GlobalPoliciesRepositoryPort
│           └── DatabasePort
└── EvaluationController
    └── EvaluationServicePort
        ├── GlobalPoliciesServicePort
        ├── PreferencesServicePort
        ├── QuietHoursServicePort
        └── LoggerPort
```

### Dependency Injection

В проекте используется собственный DI-контейнер.

Поддерживаются:

- `useValue`;
- `useClass`;
- `useFactory`;
- явные токены;
- `@Injectable()`;
- `@Inject(token)`.

Провайдеры регистрируются в `src/app/app.providers.ts`. Контейнер создаёт экземпляры лениво при первом `resolve()` и кэширует их как singleton в рамках процесса.

Точка входа:

```text
main.ts
  -> DiModule.bootstrap(appProviders)
  -> resolve(HTTP_SERVER_TOKEN)
  -> HttpServer.start()
```

OpenAPI подключён как инфраструктурный модуль и не создаёт зависимостей домена от Swagger или HTTP.

---

## Бизнес-правила

### Дефолтные предпочтения

При инициализации пользователя активные записи из `default_preferences` копируются в `user_preferences`.

Операция выполняется через `INSERT ... ON CONFLICT DO NOTHING`, поэтому повторная инициализация не создаёт дубликаты.

Тестовый сид создаёт следующую матрицу:

| Тип             | Канал   | Значение |
| --------------- | ------- | -------: |
| `transactional` | `email` |   `true` |
| `transactional` | `sms`   |   `true` |
| `transactional` | `push`  |   `true` |
| `marketing`     | `email` |  `false` |
| `marketing`     | `sms`   |  `false` |
| `marketing`     | `push`  |  `false` |

### Индивидуальные предпочтения

Пользовательская настройка определяется комбинацией:

```text
userId + notificationTypeId + channelId
```

Обновление выполняется через upsert. Существующая запись изменяется, отсутствующая создаётся.

Изменение одной комбинации не изменяет остальные предпочтения пользователя.

### Quiet hours

Quiet hours содержат:

- `startTime` в формате `HH:mm:ss`;
- `endTime` в формате `HH:mm:ss`;
- IANA timezone, например `Asia/Tbilisi`.

Границы интервала:

- начало включительно;
- окончание исключительно;
- интервалы через полночь поддерживаются;
- если `startTime === endTime`, quiet hours считаются неактивными.

Quiet hours применяются только к нетранзакционным уведомлениям. Транзакционное уведомление, разрешённое пользовательской настройкой, не блокируется quiet hours.

### Глобальные политики

Глобальная политика может быть ограничена:

- типом уведомления;
- каналом;
- регионом.

Любое из этих полей может быть `null`, что означает wildcard.

Специфичность политики определяется количеством непустых ограничений:

```text
notificationTypeId + channelId + region
```

При проверке используются политики с максимальной специфичностью. Если на одном уровне специфичности присутствуют `allow` и `deny`, решение `deny` имеет приоритет.

Причины эффективных политик возвращаются в `reasons` без дубликатов.

Разрешающая глобальная политика не обходит пользовательские предпочтения и quiet hours. Она задаёт разрешение только на уровне глобальной политики.

### Порядок проверки возможности отправки

`POST /v1/evaluate` применяет правила в следующем порядке:

1. Найти совпадающие глобальные политики.
2. Если эффективная политика запрещает отправку — вернуть `deny`.
3. Найти пользовательскую настройку для типа и канала.
4. Если настройка выключена — вернуть `deny`.
5. Если тип транзакционный — вернуть `allow`.
6. Получить quiet hours пользователя.
7. Если момент находится внутри quiet hours — вернуть `deny`.
8. Иначе вернуть `allow`.

Стандартные причины:

- `allowed`;
- `disabled_by_preference`;
- `blocked_by_quiet_hours`;
- пользовательская причина глобальной политики, например `marketing_sms_blocked_in_eu`.

### Идемпотентность

Идемпотентность применяется к следующим операциям:

- инициализация предпочтений;
- изменение предпочтения;
- сброс предпочтения;
- создание или изменение quiet hours;
- удаление quiet hours.

Клиент передаёт заголовок:

```http
Idempotency-Key: <unique-command-key>
```

Область уникальности:

```text
userId + operation + idempotencyKey
```

Поведение:

- одинаковый ключ и одинаковое тело возвращают сохранённый статус и ответ;
- одинаковый ключ с другим телом возвращает `409 idempotency_key_conflict`;
- незавершённая конкурентная операция возвращает `409 idempotency_operation_in_progress`;
- при ошибке бизнес-операции processing-запись удаляется;
- срок хранения записи — 7 дней.

Ответ содержит заголовок:

```http
Idempotency-Replayed: false
```

При повторном запросе:

```http
Idempotency-Replayed: true
```

---

## Переменные окружения

Приложение загружает файл `.env.${NODE_ENV}`. При отсутствии `NODE_ENV` для выбора файла используется `development`.

| Переменная          | Обязательна | Допустимые значения / формат                                 | Назначение                                                     |
| ------------------- | ----------: | ------------------------------------------------------------ | -------------------------------------------------------------- |
| `NODE_ENV`          |          да | `development`, `test`, `production`                          | Режим приложения                                               |
| `PORT`              |          да | `1..65535`                                                   | Внутренний HTTP-порт приложения                                |
| `LOG_LEVEL`         |         нет | `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent` | Уровень логирования, по умолчанию `info`                       |
| `LOG_PRETTY`        |         нет | `true`, `false`                                              | Форматирование логов через `pino-pretty` в development         |
| `CORS_ORIGINS`      |          да | URL через запятую либо `*`                                   | Разрешённые origins в production                               |
| `TRUST_PROXY`       |          да | `true`, `false`                                              | Настройка Express `trust proxy`                                |
| `POSTGRES_USER`     |          да | непустая строка                                              | Пользователь PostgreSQL                                        |
| `POSTGRES_PASSWORD` |          да | непустая строка                                              | Пароль PostgreSQL                                              |
| `POSTGRES_DB`       |          да | непустая строка                                              | Имя базы данных                                                |
| `POSTGRES_PORT`     |          да | `1..65535`                                                   | Порт PostgreSQL для Compose и seed-скрипта                     |
| `DATABASE_URL`      |          да | PostgreSQL URL                                               | Строка подключения приложения и миграций                       |
| `APP_PORT`          |         нет | TCP-порт                                                     | Только Docker Compose: внешний порт хоста, по умолчанию `3000` |

Важно:

- при локальном запуске приложения `DATABASE_URL` должен использовать `localhost` или `127.0.0.1`;
- внутри Docker Compose `DATABASE_URL` должен использовать hostname `postgres` и внутренний порт `5432`;
- `scripts/run-seed.ts` всегда подключается к `127.0.0.1:${POSTGRES_PORT}`.

---

## База данных

Используются таблицы:

| Таблица               | Назначение                                |
| --------------------- | ----------------------------------------- |
| `notification_types`  | Справочник типов уведомлений              |
| `channels`            | Справочник каналов                        |
| `default_preferences` | Дефолтная матрица тип × канал             |
| `user_preferences`    | Индивидуальные настройки пользователей    |
| `quiet_hours`         | Один интервал quiet hours на пользователя |
| `global_policies`     | Глобальные политики                       |
| `idempotency_records` | Состояние и ответы идемпотентных команд   |

Основные ограничения:

- уникальный `channels.code`;
- уникальный `notification_types.code`;
- уникальная комбинация дефолта `notification_type_id + channel_id`;
- уникальная комбинация пользовательской настройки `user_id + notification_type_id + channel_id`;
- одна запись quiet hours на пользователя;
- уникальная область глобальной политики с `NULLS NOT DISTINCT`;
- уникальная область идемпотентности `user_id + operation + idempotency_key`.

---

## Миграции

Миграции хранятся в директории `drizzle/`.

Drizzle-конфигурация:

```text
drizzle.config.ts
```

Схема:

```text
src/infra/database/drizzle/schema/
```

### Создание миграции

После изменения Drizzle schema:

```bash
npm run db:generate
```

Команда использует `.env.development` и создаёт SQL-миграцию в `drizzle/`.

### Применение миграций локально

```bash
npm run db:migrate
```

Команда использует `.env.development`.

### Применение production-миграций вне контейнера

```bash
npm run db:migrate:production
```

Команда использует `.env.production`.

### Применение миграций в development-контейнере

```bash
npm run db:migrate:development:docker
```

### Production Docker

Production image запускает:

```text
node dist/migrate.js
```

через `scripts/docker-entrypoint.sh` до запуска HTTP-сервера. Поэтому `npm run prod:docker:up` автоматически применяет миграции.

Команда `db:migrate:production:docker` присутствует в `package.json`, но с текущим runner image не является основным способом миграции: production image устанавливает только production dependencies, а `drizzle-kit` находится в `devDependencies`. Для production Docker используется встроенный `dist/migrate.js`.

### Drizzle Studio

```bash
npm run db:studio
```

Команда использует `.env.development`.

---

## Сиды

Тестовый сид:

```text
seeds/pg/test-data.seed.sql
```

Запуск:

```bash
npm run db:seed:test
```

Сид создаёт или обновляет:

- типы `transactional` и `marketing`;
- каналы `email`, `sms`, `push`;
- шесть дефолтных предпочтений;
- глобальную политику `marketing + sms + EU -> deny`.

Сид является повторяемым: справочники, дефолты и политика записываются через upsert.

Seed runner:

```text
scripts/run-seed.ts
```

Подключение выполняется к:

```text
127.0.0.1:${POSTGRES_PORT}
```

Поэтому при использовании Docker PostgreSQL должен публиковать порт на хост.

---

## API

Базовый URL:

```text
http://localhost:3000
```

API не содержит аутентификации. Для production-доступа административные операции должны быть защищены внешним gateway или отдельным auth-слоем.

### Swagger и OpenAPI

Интерактивная документация:

```text
GET /docs
```

OpenAPI JSON:

```text
GET /openapi.json
```

OpenAPI JSON может использоваться для генерации клиента и типов, например через `openapi-typescript`, Orval или OpenAPI Generator.

### Формат ошибок

```json
{
  "code": "invalid_request",
  "message": "Request validation failed",
  "issues": []
}
```

Для необработанной ошибки:

```json
{
  "code": "internal_server_error",
  "message": "Internal server error"
}
```

### Системные маршруты

| Метод | Путь            | Назначение                      |
| ----- | --------------- | ------------------------------- |
| `GET` | `/health`       | Проверка состояния HTTP-сервиса |
| `GET` | `/docs`         | Swagger UI                      |
| `GET` | `/openapi.json` | OpenAPI 3.1 документ            |

### Каналы

| Метод   | Путь                      | Назначение      |
| ------- | ------------------------- | --------------- |
| `GET`   | `/v1/channels`            | Получить каналы |
| `POST`  | `/v1/channels`            | Создать канал   |
| `PATCH` | `/v1/channels/:channelId` | Обновить канал  |

Создание:

```bash
curl -X POST http://localhost:3000/v1/channels \
  -H 'Content-Type: application/json' \
  -d '{
    "code": "messenger",
    "name": "Messenger"
  }'
```

Обновление:

```bash
curl -X PATCH http://localhost:3000/v1/channels/<CHANNEL_UUID> \
  -H 'Content-Type: application/json' \
  -d '{
    "isActive": false
  }'
```

Коды должны использовать lowercase snake_case.

### Типы уведомлений

| Метод   | Путь                                         | Назначение                |
| ------- | -------------------------------------------- | ------------------------- |
| `GET`   | `/v1/notification-types`                     | Получить типы уведомлений |
| `POST`  | `/v1/notification-types`                     | Создать тип               |
| `PATCH` | `/v1/notification-types/:notificationTypeId` | Обновить тип              |

Создание:

```bash
curl -X POST http://localhost:3000/v1/notification-types \
  -H 'Content-Type: application/json' \
  -d '{
    "code": "security_alert",
    "name": "Security alert",
    "isTransactional": true
  }'
```

### Глобальные политики

| Метод    | Путь                            | Назначение                            |
| -------- | ------------------------------- | ------------------------------------- |
| `GET`    | `/v1/global-policies`           | Получить политики                     |
| `POST`   | `/v1/global-policies`           | Создать или обновить политику области |
| `DELETE` | `/v1/global-policies/:policyId` | Удалить политику                      |

Создание региональной политики:

```bash
curl -X POST http://localhost:3000/v1/global-policies \
  -H 'Content-Type: application/json' \
  -d '{
    "notificationTypeId": "<NOTIFICATION_TYPE_UUID>",
    "channelId": "<CHANNEL_UUID>",
    "region": "EU",
    "decision": "deny",
    "reason": "marketing_sms_blocked_in_eu"
  }'
```

Поля `notificationTypeId`, `channelId` и `region` могут быть `null` или отсутствовать.

### Предпочтения пользователя

| Метод   | Путь                                       | Идемпотентность | Назначение               |
| ------- | ------------------------------------------ | --------------: | ------------------------ |
| `POST`  | `/v1/users/:userId/preferences/initialize` |              да | Инициализировать дефолты |
| `GET`   | `/v1/users/:userId/preferences`            |             нет | Получить предпочтения    |
| `PATCH` | `/v1/users/:userId/preferences`            |              да | Изменить одну настройку  |
| `POST`  | `/v1/users/:userId/preferences/reset`      |              да | Сбросить одну настройку  |

Инициализация пользователя:

```bash
curl -i -X POST \
  http://localhost:3000/v1/users/user-1/preferences/initialize \
  -H 'Idempotency-Key: initialize-user-1'
```

Получение предпочтений:

```bash
curl http://localhost:3000/v1/users/user-1/preferences
```

Пример ответа:

```json
{
  "data": [
    {
      "id": "7e21b123-1599-4b21-b318-4fbcefa43156",
      "userId": "user-1",
      "notificationTypeId": "8d15ebf6-20fb-4fe9-a780-ea9dfe557ca7",
      "notificationTypeCode": "marketing",
      "notificationTypeName": "Marketing",
      "isTransactional": false,
      "channelId": "315c1076-1b59-49a8-b28c-4109e73198b2",
      "channelCode": "email",
      "enabled": false,
      "createdAt": "2026-06-19T10:00:00.000Z",
      "updatedAt": "2026-06-19T10:00:00.000Z"
    }
  ]
}
```

Изменение предпочтения:

```bash
curl -i -X PATCH \
  http://localhost:3000/v1/users/user-1/preferences \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: enable-marketing-email-user-1' \
  -d '{
    "notificationTypeId": "<MARKETING_UUID>",
    "channelId": "<EMAIL_UUID>",
    "enabled": true
  }'
```

Сброс к дефолту:

```bash
curl -i -X POST \
  http://localhost:3000/v1/users/user-1/preferences/reset \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: reset-marketing-email-user-1' \
  -d '{
    "notificationTypeId": "<MARKETING_UUID>",
    "channelId": "<EMAIL_UUID>"
  }'
```

### Quiet hours

| Метод    | Путь                            | Идемпотентность | Назначение           |
| -------- | ------------------------------- | --------------: | -------------------- |
| `GET`    | `/v1/users/:userId/quiet-hours` |             нет | Получить quiet hours |
| `PATCH`  | `/v1/users/:userId/quiet-hours` |              да | Создать или обновить |
| `DELETE` | `/v1/users/:userId/quiet-hours` |              да | Удалить              |

Создание или обновление:

```bash
curl -i -X PATCH \
  http://localhost:3000/v1/users/user-1/quiet-hours \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: set-quiet-hours-user-1-v1' \
  -d '{
    "startTime": "22:00:00",
    "endTime": "08:00:00",
    "timezone": "Asia/Tbilisi"
  }'
```

Удаление:

```bash
curl -i -X DELETE \
  http://localhost:3000/v1/users/user-1/quiet-hours \
  -H 'Idempotency-Key: delete-quiet-hours-user-1'
```

### Проверка возможности отправки

| Метод  | Путь           | Назначение                        |
| ------ | -------------- | --------------------------------- |
| `POST` | `/v1/evaluate` | Получить решение `allow` / `deny` |

API использует UUID типа уведомления и канала. Их можно получить через:

```text
GET /v1/notification-types
GET /v1/channels
```

Запрос:

```bash
curl -X POST http://localhost:3000/v1/evaluate \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user-1",
    "notificationTypeId": "<MARKETING_UUID>",
    "channelId": "<SMS_UUID>",
    "region": "EU",
    "datetime": "2026-05-21T21:30:00.000Z"
  }'
```

Ответ:

```json
{
  "decision": "deny",
  "reasons": ["marketing_sms_blocked_in_eu"]
}
```

---

## Тесты

Интеграционные тесты используют:

- Vitest;
- Testcontainers;
- PostgreSQL 17;
- реальные Drizzle-репозитории;
- реальные SQL-миграции;
- тестовый SQL-сид.

Для запуска необходим работающий Docker daemon.

Все тесты:

```bash
npm test
```

Только интеграционные тесты:

```bash
npm run test:integration
```

Watch mode:

```bash
npm run test:watch
```

Тесты выполняются последовательно (`fileParallelism: false`), поскольку используют общий PostgreSQL container и сбрасывают таблицы перед каждым сценарием.

Покрытые сценарии:

1. Новый пользователь получает шесть дефолтных предпочтений.
2. Изменение одной настройки не изменяет остальные.
3. Quiet hours блокируют маркетинговые уведомления и не блокируют транзакционные.
4. Региональная глобальная политика имеет приоритет перед пользовательской настройкой.
5. Повторная идемпотентная команда возвращает сохранённый результат и не выполняет обработчик второй раз.

---

## Логирование и observability

Используется структурированное логирование Pino.

Логируются:

- входящие HTTP-запросы;
- HTTP-статусы и продолжительность;
- инициализация предпочтений;
- изменение и сброс предпочтений;
- создание, изменение и удаление quiet hours;
- решения `allow` / `deny`;
- ошибки PostgreSQL pool;
- необработанные HTTP-ошибки.

Для каждого HTTP-запроса:

- используется входящий `x-request-id`, если он передан;
- иначе генерируется UUID;
- `x-request-id` возвращается в ответе.

Уровни HTTP-логов:

- `info` — успешные ответы;
- `warn` — ответы `4xx`;
- `error` — ошибки `5xx`.

Чувствительные поля `authorization`, `password`, `token`, `accessToken` и `refreshToken` редактируются как `[REDACTED]`.

---

## Docker

### Development

```bash
npm run dev:docker:up
```

Используется:

```text
compose.development.yaml
```

Особенности:

- source code монтируется в `/app`;
- `node_modules` хранится в отдельном anonymous volume;
- приложение запускается через `npm run dev`;
- PostgreSQL доступен с хоста через `127.0.0.1:${POSTGRES_PORT}`.

### Production

Создать `.env.production`, затем:

```bash
npm run prod:docker:up
```

Используется multi-stage image:

- `dependencies`;
- `builder`;
- `runner`.

Runner:

- запускается от пользователя `node`;
- содержит только production dependencies;
- автоматически применяет миграции;
- запускает `node dist/main.js`.

Остановка:

```bash
npm run prod:docker:down
```

---

## npm scripts

| Команда                                 | Назначение                                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                           | Запустить `src/main.ts` через `tsx watch`                                                                        |
| `npm run build`                         | Собрать `src/main.ts` и `src/migrate.ts` через tsup                                                              |
| `npm start`                             | Запустить `dist/main.js`                                                                                         |
| `npm run typecheck`                     | Проверить типы source и test code                                                                                |
| `npm run typecheck:src`                 | Проверить `src/**/*.ts`                                                                                          |
| `npm run typecheck:test`                | Проверить `src`, `tests` и Vitest config                                                                         |
| `npm run prepare`                       | Установить Husky hooks; автоматически вызывается npm                                                             |
| `npm run lint`                          | Проверить проект ESLint                                                                                          |
| `npm run lint:fix`                      | Исправить поддерживаемые ESLint-ошибки                                                                           |
| `npm run format`                        | Отформатировать проект Prettier                                                                                  |
| `npm run format:check`                  | Проверить форматирование без изменения файлов                                                                    |
| `npm run dev:docker:up`                 | Собрать и запустить development Compose в foreground                                                             |
| `npm run dev:docker:down`               | Остановить development Compose                                                                                   |
| `npm run dev:docker:renew`              | Пересобрать development Compose и обновить anonymous volumes                                                     |
| `npm run prod:docker:up`                | Собрать и запустить production Compose в detached mode                                                           |
| `npm run prod:docker:down`              | Остановить production Compose                                                                                    |
| `npm run prod:docker:renew`             | Пересобрать production Compose и обновить anonymous volumes                                                      |
| `npm run db:seed:test`                  | Выполнить `seeds/pg/test-data.seed.sql`                                                                          |
| `npm run db:generate`                   | Сгенерировать development-миграцию Drizzle                                                                       |
| `npm run db:migrate`                    | Применить миграции с `.env.development`                                                                          |
| `npm run db:studio`                     | Запустить Drizzle Studio с `.env.development`                                                                    |
| `npm run db:migrate:production`         | Применить миграции с `.env.production`                                                                           |
| `npm run db:migrate:production:docker`  | Выполнить migration script внутри production app container; не является основным путём для текущего runner image |
| `npm run db:migrate:development:docker` | Выполнить development migration script внутри app container                                                      |
| `npm run source-code:generate`          | Сформировать агрегированный JSON со snapshot исходного кода                                                      |
| `npm test`                              | Однократно выполнить все Vitest tests                                                                            |
| `npm run test:watch`                    | Запустить Vitest в watch mode                                                                                    |
| `npm run test:integration`              | Выполнить только `tests/integration`                                                                             |

### Git hooks

`pre-commit`:

```text
lint-staged
```

`pre-push`:

```text
typecheck
lint
build
```

---

## Проверка перед отправкой решения

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
npm test
```

Для ручной проверки API:

```bash
npm run db:migrate
npm run db:seed:test
npm run dev
```

После этого открыть:

```text
http://localhost:3000/docs
```

---

## Ограничения текущей реализации

- отсутствуют аутентификация и авторизация административных маршрутов;
- `userId` не проверяется через внешний User Service;
- нет отдельного API управления `default_preferences`;
- нет фоновой очистки истёкших idempotency records;
- health endpoint проверяет HTTP-процесс, но не выполняет readiness-проверку PostgreSQL;
- нет rate limiting;
- нет метрик Prometheus и distributed tracing;
- миграции production-контейнера выполняются при старте приложения, а не отдельным deployment job;
- отсутствует кэширование результатов оценки;
- отсутствует аудит административных изменений каналов, типов и глобальных политик.

---

## Что добавить для production

1. Аутентификацию service-to-service и RBAC для административных маршрутов.
2. Отдельные liveness и readiness endpoints с проверкой PostgreSQL.
3. Метрики:
   - количество `allow` / `deny`;
   - причины отказов;
   - latency `/v1/evaluate`;
   - количество idempotency replay/conflict;
   - ошибки PostgreSQL.
4. OpenTelemetry traces и корреляцию с `x-request-id`.
5. Периодическую очистку истёкших `idempotency_records`.
6. Rate limiting и request quotas.
7. Audit log для глобальных политик и пользовательских изменений.
8. Отдельный deployment job для миграций.
9. Transaction boundaries для составных операций.
10. Контрактные и HTTP end-to-end тесты.
11. Версионирование и правила совместимости OpenAPI.
12. Кэширование справочников и глобальных политик с контролируемой инвалидацией.
13. Secret manager вместо файловых production env.
14. Ограничение доступа к Swagger UI в production.
15. Политику хранения и удаления пользовательских настроек.

---

## License

ISC.
