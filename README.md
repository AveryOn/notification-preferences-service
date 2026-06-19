# Notification Preferences Service

[Quick Start](./getting_started.md)

Notification Preferences Service — backend-сервис для хранения настроек
уведомлений и принятия решения о допустимости отправки уведомления конкретному
пользователю.

Сервис не отправляет уведомления. Он управляет каналами, типами уведомлений,
пользовательскими предпочтениями, quiet hours и глобальными политиками, а затем
возвращает решение `allow` или `deny` с причинами.

## Содержание

- [Возможности](#возможности)
- [Технологический стек](#технологический-стек)
- [Быстрый старт](#быстрый-старт)
- [Запуск полностью в Docker](#запуск-полностью-в-docker)
- [Production-запуск](#production-запуск)
- [Конфигурация окружения](#конфигурация-окружения)
- [HTTP API](#http-api)
- [Бизнес-правила](#бизнес-правила)
- [Архитектура](#архитектура)
- [База данных](#база-данных)
- [Миграции](#миграции)
- [Тестовые данные](#тестовые-данные)
- [Тестирование](#тестирование)
- [Команды проекта](#команды-проекта)
- [Git hooks](#git-hooks)
- [Полный сброс Docker](#полный-сброс-docker)
- [Диагностика](#диагностика)
- [Текущие ограничения](#текущие-ограничения)

## Возможности

Сервис реализует:

- справочник каналов доставки;
- справочник типов уведомлений;
- дефолтную матрицу предпочтений;
- инициализацию предпочтений пользователя;
- изменение и сброс отдельных предпочтений;
- quiet hours с поддержкой IANA timezone;
- глобальные политики по типу уведомления, каналу и региону;
- вычисление итогового решения `allow` / `deny`;
- идемпотентность команд изменения пользовательского состояния;
- OpenAPI 3.1 и Swagger UI;
- структурированное HTTP-логирование с `x-request-id`;
- PostgreSQL-миграции через Drizzle;
- интеграционные тесты через Vitest и Testcontainers.

`userId` является внешним идентификатором. Сервис не содержит собственной
таблицы пользователей и не проверяет существование пользователя во внешней
системе.

## Технологический стек

- Node.js 24;
- TypeScript 6;
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
- ESLint и Prettier;
- Husky и lint-staged.

## Быстрый старт

Рекомендуемый режим разработки:

- приложение запускается локально через Node.js;
- PostgreSQL запускается через Docker Compose;
- миграции и seed выполняются с хоста.

Этот режим соответствует текущей реализации `scripts/run-seed.ts`, которая
подключается к PostgreSQL через `127.0.0.1:${POSTGRES_PORT}`.

### 1. Клонировать репозиторий

```bash
git clone https://github.com/AveryOn/notification-preferences-service.git
cd notification-preferences-service
```

### 2. Подготовить Node.js

Требуется Node.js `>= 24`. Версия проекта зафиксирована в `.nvmrc`.

```bash
nvm install
nvm use
node --version
```

Ожидается версия `v24.x.x` или новее.

### 3. Установить зависимости

```bash
npm ci
```

### 4. Создать development-конфигурацию

```bash
cp .env.example .env.development
```

Для рекомендованного режима установите согласованные значения порта
PostgreSQL:

```dotenv
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
LOG_PRETTY=true
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
TRUST_PROXY=false

SWAGGER_URL=/docs
SWAGGER_JSON_URL=/docs/json

POSTGRES_USER=notification_service
POSTGRES_PASSWORD=notification_service
POSTGRES_DB=notification_preferences
POSTGRES_PORT=5433
DATABASE_URL=postgres://notification_service:notification_service@127.0.0.1:5433/notification_preferences
```

> В текущем `.env.example` значения `POSTGRES_PORT` и порта в `DATABASE_URL`
> различаются. Перед запуском они должны быть приведены к одному значению.

### 5. Запустить PostgreSQL

```bash
docker compose \
  --env-file .env.development \
  -f compose.development.yaml \
  up -d postgres
```

Проверить состояние контейнера:

```bash
docker compose \
  --env-file .env.development \
  -f compose.development.yaml \
  ps
```

PostgreSQL должен перейти в состояние `healthy`.

### 6. Применить миграции

```bash
npm run db:migrate
```

### 7. Загрузить тестовые справочники

```bash
npm run db:seed:test
```

Seed нужен для готового набора каналов, типов уведомлений, дефолтных
предпочтений и тестовой глобальной политики.

### 8. Запустить приложение

```bash
npm run dev
```

После запуска доступны:

| Ресурс       | URL                               |
| ------------ | --------------------------------- |
| API          | `http://localhost:3000`           |
| Health check | `http://localhost:3000/health`    |
| Swagger UI   | `http://localhost:3000/docs`      |
| OpenAPI JSON | `http://localhost:3000/docs/json` |

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

### 9. Остановить PostgreSQL

```bash
docker compose \
  --env-file .env.development \
  -f compose.development.yaml \
  down
```

Обычный `down` не удаляет данные PostgreSQL из named volume.

## Запуск полностью в Docker

В этом режиме приложение и PostgreSQL работают внутри Docker Compose.

### 1. Подготовить окружение

```bash
cp .env.example .env.development
```

Используйте следующую конфигурацию:

```dotenv
NODE_ENV=development
PORT=3000
APP_PORT=3000
LOG_LEVEL=debug
LOG_PRETTY=true
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
TRUST_PROXY=false

SWAGGER_URL=/docs
SWAGGER_JSON_URL=/docs/json

POSTGRES_USER=notification_service
POSTGRES_PASSWORD=notification_service
POSTGRES_DB=notification_preferences
POSTGRES_PORT=5433
DATABASE_URL=postgres://notification_service:notification_service@postgres:5432/notification_preferences
```

Правила для Compose-конфигурации:

- `DATABASE_URL` должен использовать hostname `postgres`;
- внутренний порт PostgreSQL всегда равен `5432`;
- `POSTGRES_PORT` определяет опубликованный порт PostgreSQL на хосте;
- `PORT` должен оставаться равным `3000`, потому что Compose публикует порт
  контейнера `3000`;
- `APP_PORT` определяет внешний порт приложения на хосте.

### 2. Собрать и запустить сервисы

```bash
npm run dev:docker:up
```

Команда работает в foreground и выводит логи обоих контейнеров. Для следующих
шагов откройте второй терминал.

### 3. Применить миграции внутри app-контейнера

```bash
npm run db:migrate:development:docker
```

Development-контейнер не применяет миграции автоматически.

### 4. Загрузить тестовые данные

```bash
npm run db:seed:test
```

Seed запускается на хосте и подключается к
`127.0.0.1:${POSTGRES_PORT}`. Поэтому для этой команды должны быть установлены
локальные npm-зависимости:

```bash
npm ci
```

### 5. Остановить development-сервисы

```bash
npm run dev:docker:down
```

## Production-запуск

Production Compose собирает multi-stage Docker image, устанавливает только
production dependencies и запускает приложение из `dist/`.

### 1. Создать production-конфигурацию

```bash
cp .env.example .env.production
```

Пример:

```dotenv
NODE_ENV=production
PORT=3000
APP_PORT=3000
LOG_LEVEL=info
LOG_PRETTY=false
CORS_ORIGINS=https://app.example.com
TRUST_PROXY=true

SWAGGER_URL=/docs
SWAGGER_JSON_URL=/docs/json

POSTGRES_USER=notification_service
POSTGRES_PASSWORD=replace_with_strong_password
POSTGRES_DB=notification_preferences
POSTGRES_PORT=5433
DATABASE_URL=postgres://notification_service:replace_with_strong_password@postgres:5432/notification_preferences
```

Не храните `.env.production` в Git.

### 2. Запустить production Compose

```bash
npm run prod:docker:up
```

Production entrypoint выполняет миграции автоматически:

```text
node dist/migrate.js
node dist/main.js
```

HTTP-сервер запускается только после успешного завершения миграций.

### 3. Проверить состояние

```bash
docker compose \
  --env-file .env.production \
  -f compose.production.yaml \
  ps

curl http://localhost:3000/health
```

### 4. Просмотреть логи

```bash
docker compose \
  --env-file .env.production \
  -f compose.production.yaml \
  logs -f app
```

### 5. Остановить production-сервисы

```bash
npm run prod:docker:down
```

Тестовый seed в production не запускается.

## Конфигурация окружения

Приложение загружает файл, соответствующий `NODE_ENV`:

```text
.env.development
.env.test
.env.production
```

Если `NODE_ENV` не задан, используется `development`.

| Переменная          | Обязательна | Допустимые значения                                          | Назначение                                 |
| ------------------- | ----------: | ------------------------------------------------------------ | ------------------------------------------ |
| `NODE_ENV`          |          да | `development`, `test`, `production`                          | Режим приложения                           |
| `PORT`              |          да | `1..65535`                                                   | Порт HTTP-сервера внутри процесса          |
| `APP_PORT`          |         нет | TCP-порт                                                     | Внешний порт приложения в Docker Compose   |
| `LOG_LEVEL`         |         нет | `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent` | Уровень Pino, по умолчанию `info`          |
| `LOG_PRETTY`        |         нет | `true`, `false`                                              | Pretty-логи только в development           |
| `CORS_ORIGINS`      |          да | URL через запятую или `*`                                    | Разрешённые origins в production           |
| `TRUST_PROXY`       |          да | `true`, `false`                                              | Значение Express `trust proxy`             |
| `SWAGGER_URL`       |         нет | путь, начинающийся с `/`                                     | Swagger UI, по умолчанию `/docs`           |
| `SWAGGER_JSON_URL`  |         нет | путь, начинающийся с `/`                                     | OpenAPI JSON, по умолчанию `/docs/json`    |
| `POSTGRES_USER`     |          да | непустая строка                                              | Пользователь PostgreSQL                    |
| `POSTGRES_PASSWORD` |          да | непустая строка                                              | Пароль PostgreSQL                          |
| `POSTGRES_DB`       |          да | непустая строка                                              | Имя базы данных                            |
| `POSTGRES_PORT`     |          да | `1..65535`                                                   | Порт PostgreSQL на хосте и для seed runner |
| `DATABASE_URL`      |          да | валидный URL                                                 | Подключение приложения и миграций          |

### Важные особенности

- В development CORS разрешает любой origin независимо от `CORS_ORIGINS`.
- В production CORS использует список из `CORS_ORIGINS`.
- Helmet включается только в production.
- Размер JSON и URL-encoded body ограничен `1mb`.
- `APP_PORT` используется Docker Compose и не валидируется приложением.
- В Compose изменяйте внешний порт через `APP_PORT`, а не через `PORT`.

## HTTP API

Точные request/response schemas и интерактивные примеры находятся в Swagger UI:

```text
GET /docs
```

OpenAPI 3.1 документ:

```text
GET /docs/json
```

Пути могут быть изменены через `SWAGGER_URL` и `SWAGGER_JSON_URL`.

### Системные маршруты

| Метод | Путь         | Назначение                         |
| ----- | ------------ | ---------------------------------- |
| `GET` | `/health`    | Проверка доступности HTTP-процесса |
| `GET` | `/docs`      | Swagger UI                         |
| `GET` | `/docs/json` | OpenAPI JSON                       |

`/health` не проверяет подключение к PostgreSQL и не является readiness probe.

### Каналы

| Метод   | Путь                      | Назначение              |
| ------- | ------------------------- | ----------------------- |
| `GET`   | `/v1/channels`            | Получить список каналов |
| `POST`  | `/v1/channels`            | Создать канал           |
| `PATCH` | `/v1/channels/:channelId` | Изменить канал          |

Код канала должен использовать lowercase snake_case, например `email` или
`mobile_push`.

### Типы уведомлений

| Метод   | Путь                                         | Назначение            |
| ------- | -------------------------------------------- | --------------------- |
| `GET`   | `/v1/notification-types`                     | Получить список типов |
| `POST`  | `/v1/notification-types`                     | Создать тип           |
| `PATCH` | `/v1/notification-types/:notificationTypeId` | Изменить тип          |

Тип может быть транзакционным (`isTransactional: true`). Транзакционные
уведомления не блокируются quiet hours, но по-прежнему учитывают глобальный
`deny` и пользовательское предпочтение.

### API глобальных политик

| Метод    | Путь                            | Назначение                            |
| -------- | ------------------------------- | ------------------------------------- |
| `GET`    | `/v1/global-policies`           | Получить политики                     |
| `POST`   | `/v1/global-policies`           | Создать или обновить политику области |
| `DELETE` | `/v1/global-policies/:policyId` | Удалить политику                      |

`POST /v1/global-policies` выполняет upsert по комбинации:

```text
notificationTypeId + channelId + region
```

Поля области могут быть `null`; такое значение работает как wildcard.

### Предпочтения пользователя

| Метод   | Путь                                       | Idempotency-Key | Назначение                                |
| ------- | ------------------------------------------ | --------------: | ----------------------------------------- |
| `POST`  | `/v1/users/:userId/preferences/initialize` |      обязателен | Скопировать активные дефолты пользователю |
| `GET`   | `/v1/users/:userId/preferences`            |             нет | Получить предпочтения                     |
| `PATCH` | `/v1/users/:userId/preferences`            |      обязателен | Изменить одну настройку                   |
| `POST`  | `/v1/users/:userId/preferences/reset`      |      обязателен | Сбросить одну настройку к дефолту         |

Пример инициализации:

```bash
curl -i -X POST \
  http://localhost:3000/v1/users/user-1/preferences/initialize \
  -H 'Idempotency-Key: initialize-user-1'
```

### API quiet hours

| Метод    | Путь                            | Idempotency-Key | Назначение                       |
| -------- | ------------------------------- | --------------: | -------------------------------- |
| `GET`    | `/v1/users/:userId/quiet-hours` |             нет | Получить quiet hours             |
| `PATCH`  | `/v1/users/:userId/quiet-hours` |      обязателен | Создать или обновить quiet hours |
| `DELETE` | `/v1/users/:userId/quiet-hours` |      обязателен | Удалить quiet hours              |

Время передаётся в формате `HH:mm:ss`, timezone — в формате IANA:

```json
{
  "startTime": "22:00:00",
  "endTime": "08:00:00",
  "timezone": "Asia/Tbilisi"
}
```

### Проверка возможности отправки

| Метод  | Путь           | Назначение                                |
| ------ | -------------- | ----------------------------------------- |
| `POST` | `/v1/evaluate` | Вернуть итоговое решение `allow` / `deny` |

Пример:

```bash
curl -X POST http://localhost:3000/v1/evaluate \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user-1",
    "notificationTypeId": "<NOTIFICATION_TYPE_UUID>",
    "channelId": "<CHANNEL_UUID>",
    "region": "GE",
    "datetime": "2026-06-19T12:00:00.000Z"
  }'
```

Пример ответа:

```json
{
  "decision": "deny",
  "reasons": ["blocked_by_quiet_hours"]
}
```

`datetime` должен быть ISO 8601 datetime с timezone offset.

### Формат ошибок

Ошибка валидации:

```json
{
  "code": "invalid_request",
  "message": "Request validation failed",
  "issues": []
}
```

Неизвестный маршрут:

```json
{
  "code": "route_not_found",
  "message": "Route was not found"
}
```

Необработанная ошибка:

```json
{
  "code": "internal_server_error",
  "message": "Internal server error"
}
```

Каждый HTTP-ответ содержит `x-request-id`. Если клиент передал строковый
`x-request-id`, сервис сохраняет его; иначе генерируется UUID.

## Бизнес-правила

### Инициализация предпочтений

При инициализации активные записи из `default_preferences` копируются в
`user_preferences`.

Повторная инициализация безопасна: используется `ON CONFLICT DO NOTHING`,
поэтому существующие предпочтения не перезаписываются.

### Изменение предпочтения

Пользовательская настройка определяется комбинацией:

```text
userId + notificationTypeId + channelId
```

Изменение выполняется через upsert. Перед изменением сервис требует, чтобы у
пользователя уже существовал хотя бы один активный набор предпочтений.

### Сброс предпочтения

Сброс восстанавливает значение из `default_preferences` для конкретной пары
`notificationTypeId + channelId`.

Если дефолт для пары отсутствует, сервис возвращает `404`.

### Quiet hours

- начало интервала включительно;
- конец интервала исключительно;
- интервалы через полночь поддерживаются;
- `startTime === endTime` означает, что интервал не блокирует уведомления;
- момент запроса переводится в timezone пользователя через `Intl.DateTimeFormat`;
- quiet hours применяются только к нетранзакционным типам.

### Глобальные политики

Политика может быть ограничена:

- типом уведомления;
- каналом;
- регионом.

`null` означает wildcard. Совпадение региона является точным и
регистрозависимым.

Специфичность равна количеству непустых ограничений. Применяются только
совпавшие политики максимальной специфичности. Если на одном уровне
специфичности одновременно существуют `allow` и `deny`, приоритет имеет
`deny`.

### Порядок вычисления решения

`POST /v1/evaluate` выполняет проверки в следующем порядке:

1. Найти совпадающие глобальные политики.
2. Если эффективная политика равна `deny`, немедленно вернуть `deny`.
3. Найти пользовательское предпочтение для типа и канала.
4. Если предпочтение выключено, вернуть `deny`.
5. Если тип транзакционный, вернуть `allow`.
6. Получить quiet hours пользователя.
7. Если момент находится внутри quiet hours, вернуть `deny`.
8. Иначе вернуть `allow`.

Стандартные причины:

- `allowed`;
- `disabled_by_preference`;
- `blocked_by_quiet_hours`;
- `reason` применённой глобальной политики.

Глобальный `allow` не обходит пользовательский `deny` и quiet hours.

### Идемпотентность

Идемпотентность используется для:

- инициализации предпочтений;
- изменения предпочтения;
- сброса предпочтения;
- создания или изменения quiet hours;
- удаления quiet hours.

Заголовок:

```http
Idempotency-Key: <unique-command-key>
```

Ключ должен содержать от 1 до 255 символов.

Область уникальности:

```text
userId + operation + idempotencyKey
```

Поведение:

- первый запрос выполняет операцию и сохраняет HTTP status и body;
- повтор с тем же ключом и тем же payload возвращает сохранённый результат;
- повтор с другим payload возвращает `409 idempotency_key_conflict`;
- конкурентный незавершённый запрос возвращает
  `409 idempotency_operation_in_progress`;
- срок хранения записи — 7 дней;
- ответ содержит `Idempotency-Replayed: true|false`.

Истёкшая запись удаляется лениво при следующей операции в той же области.

## Архитектура

Проект использует модульную архитектуру с явным разделением домена, портов,
HTTP-адаптеров и persistence-адаптеров.

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
│   ├── evaluation/
│   ├── global-policies/
│   ├── idempotency/
│   ├── notification-types/
│   ├── preferences/
│   └── quiet-hours/
├── env.ts
├── main.ts
└── migrate.ts
```

Типовая структура модуля:

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

- `domain` — бизнес-правила, доменные типы и ошибки;
- `ports` — абстракции сервисов и репозиториев;
- `infra/http` — Express-контроллеры, Zod DTO и HTTP mapping;
- `infra/persistence` — реализации репозиториев на Drizzle;
- `infra/database` — PostgreSQL pool, Drizzle client и `DatabasePort`;
- `infra/openapi` — OpenAPI document и Swagger UI;
- `app` — composition root и регистрация зависимостей.

### Dependency Injection

Проект содержит собственный DI-контейнер с поддержкой:

- `useValue`;
- `useClass`;
- `useFactory`;
- class и symbol tokens;
- `@Injectable()`;
- `@Inject(token)`;
- singleton-кэширования в рамках контейнера.

Точка входа:

```text
src/main.ts
  -> DiModule.bootstrap(appProviders)
  -> resolve(HTTP_SERVER_TOKEN)
  -> HttpServer.start()
```

Домен зависит от портов и не импортирует Express или Drizzle.

## База данных

| Таблица               | Назначение                                |
| --------------------- | ----------------------------------------- |
| `channels`            | Каналы доставки                           |
| `notification_types`  | Типы уведомлений                          |
| `default_preferences` | Дефолтная матрица тип × канал             |
| `user_preferences`    | Пользовательские настройки                |
| `quiet_hours`         | Один интервал quiet hours на пользователя |
| `global_policies`     | Политики по типу, каналу и региону        |
| `idempotency_records` | Состояние идемпотентных операций          |

Основные ограничения:

- уникальный `channels.code`;
- уникальный `notification_types.code`;
- уникальный дефолт `notification_type_id + channel_id`;
- уникальная пользовательская настройка
  `user_id + notification_type_id + channel_id`;
- одна запись quiet hours на пользователя;
- уникальная область глобальной политики с `NULLS NOT DISTINCT`;
- уникальная область идемпотентности
  `user_id + operation + idempotency_key`.

Foreign keys для типов и каналов используют `ON DELETE RESTRICT` и
`ON UPDATE CASCADE`.

## Миграции

Исходная Drizzle schema:

```text
src/infra/database/drizzle/schema/
```

Сгенерированные миграции:

```text
drizzle/
```

Конфигурация Drizzle Kit:

```text
drizzle.config.ts
```

### Сгенерировать migration

```bash
npm run db:generate
```

Команда использует `.env.development`.

### Применить development migrations с хоста

```bash
npm run db:migrate
```

### Применить development migrations в app-контейнере

```bash
npm run db:migrate:development:docker
```

### Применить production migrations с хоста

```bash
npm run db:migrate:production
```

Этот сценарий предназначен для среды, где `DATABASE_URL` из `.env.production`
доступен с хоста.

### Миграции в Production Docker

Production image не использует Drizzle Kit для старта. В bundle входит
`dist/migrate.js`, который использует runtime package `drizzle-orm` и выполняется
entrypoint-скриптом до запуска приложения.

Команда `db:migrate:production:docker` присутствует в `package.json`, но в
текущем состоянии не поддерживается:

- она вызывает development-команду `db:migrate`;
- runner image устанавливает зависимости через `npm ci --omit=dev`;
- `drizzle-kit` находится в `devDependencies`;
- runner image не содержит `drizzle.config.ts`.

Для production Compose используйте автоматическую миграцию через
`npm run prod:docker:up`.

### Drizzle Studio

```bash
npm run db:studio
```

Команда использует `.env.development` и требует доступную с хоста базу данных.

## Тестовые данные

Seed-файл:

```text
seeds/pg/test-data.seed.sql
```

Запуск:

```bash
npm run db:seed:test
```

Seed создаёт или обновляет:

- тип `transactional`;
- тип `marketing`;
- каналы `email`, `sms`, `push`;
- шесть дефолтных предпочтений;
- политику `marketing + sms + EU -> deny`.

Дефолтная матрица:

| Тип             |   Email |     SMS |    Push |
| --------------- | ------: | ------: | ------: |
| `transactional` |  `true` |  `true` |  `true` |
| `marketing`     | `false` | `false` | `false` |

Seed повторяем: справочники, дефолты и политика записываются через upsert.

## Тестирование

Тесты используют PostgreSQL Testcontainer. Перед запуском должен быть доступен
Docker daemon.

### Все тесты

```bash
npm test
```

### Только integration suite

```bash
npm run test:integration
```

### Watch mode

```bash
npm run test:watch
```

Текущие интеграционные сценарии проверяют:

- инициализацию пользователя дефолтами;
- изменение одного предпочтения без изменения остальных;
- блокировку нетранзакционных уведомлений в quiet hours;
- обход quiet hours транзакционными уведомлениями;
- приоритет региональной глобальной политики;
- replay идемпотентной команды без повторного выполнения handler.

## Команды проекта

### Приложение и сборка

| Команда         | Назначение                                                          |
| --------------- | ------------------------------------------------------------------- |
| `npm run dev`   | Запустить `tsx watch src/main.ts`                                   |
| `npm run build` | Собрать `src/main.ts` и `src/migrate.ts` в `dist/` через tsup       |
| `npm start`     | Запустить `node dist/main.js`; предварительно нужен `npm run build` |

### Проверки качества

| Команда                  | Назначение                                                       |
| ------------------------ | ---------------------------------------------------------------- |
| `npm run typecheck`      | Проверить production и test TypeScript configs                   |
| `npm run typecheck:src`  | Проверить `src/**/*.ts`                                          |
| `npm run typecheck:test` | Проверить `src`, `tests` и Vitest config                         |
| `npm run lint`           | Запустить ESLint без изменений                                   |
| `npm run lint:fix`       | Исправить поддерживаемые ESLint-ошибки                           |
| `npm run format`         | Отформатировать проект Prettier                                  |
| `npm run format:check`   | Проверить форматирование без изменений                           |
| `npm run prepare`        | Установить Husky hooks; npm вызывает автоматически после install |

### Development Docker

| Команда                    | Назначение                                                |
| -------------------------- | --------------------------------------------------------- |
| `npm run dev:docker:up`    | Собрать и запустить app + PostgreSQL в foreground         |
| `npm run dev:docker:down`  | Остановить development Compose без удаления named volume  |
| `npm run dev:docker:renew` | Пересобрать сервисы и пересоздать anonymous volumes       |
| `npm run docker-reset`     | Полностью удалить development Compose и связанные ресурсы |

`dev:docker:renew` не удаляет named volume PostgreSQL. Для сброса данных
используйте `npm run docker-reset`.

### Production Docker

| Команда                     | Назначение                                              |
| --------------------------- | ------------------------------------------------------- |
| `npm run prod:docker:up`    | Собрать и запустить production Compose в detached mode  |
| `npm run prod:docker:down`  | Остановить production Compose без удаления named volume |
| `npm run prod:docker:renew` | Пересобрать сервисы и пересоздать anonymous volumes     |

`prod:docker:renew` также не удаляет named volume PostgreSQL.

### Команды базы данных

| Команда                                 | Назначение                                                    |
| --------------------------------------- | ------------------------------------------------------------- |
| `npm run db:generate`                   | Сгенерировать development migration                           |
| `npm run db:migrate`                    | Применить migrations с `.env.development`                     |
| `npm run db:migrate:development:docker` | Применить migrations внутри development app container         |
| `npm run db:migrate:production`         | Применить migrations с `.env.production` с хоста              |
| `npm run db:migrate:production:docker`  | Не поддерживается текущим runner image; см. раздел «Миграции» |
| `npm run db:studio`                     | Запустить Drizzle Studio                                      |
| `npm run db:seed:test`                  | Выполнить тестовый PostgreSQL seed с хоста                    |

### Тесты и служебные команды

| Команда                        | Назначение                                                                  |
| ------------------------------ | --------------------------------------------------------------------------- |
| `npm test`                     | Однократно выполнить все Vitest tests                                       |
| `npm run test:watch`           | Запустить Vitest в watch mode                                               |
| `npm run test:integration`     | Выполнить `tests/integration`                                               |
| `npm run source-code:generate` | Собрать tracked и untracked source files в `project_whole_code_source.json` |

`source-code:generate` требует Git и исключает файлы, игнорируемые через
`.gitignore`.

## Git hooks

### pre-commit

```text
npx lint-staged
```

Для изменённых TypeScript-файлов выполняются ESLint fix и Prettier. Для JSON,
Markdown и YAML выполняется Prettier.

### pre-push

```text
npm run typecheck
npm run lint
npm run build
```

Тесты и `format:check` автоматически в pre-push не запускаются.

Рекомендуемая полная локальная проверка перед push:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
npm test
```

## Полный сброс Docker

Команда:

```bash
npm run docker-reset
```

Скрипт выполняет destructive reset:

- останавливает development Compose;
- удаляет Compose containers;
- удаляет named и anonymous volumes;
- удаляет orphan containers;
- удаляет images, используемые development Compose;
- дополнительно удаляет контейнеры, volumes и networks с именами проекта.

После сброса данные PostgreSQL восстановить нельзя.

Повторный запуск для локального режима:

```bash
docker compose \
  --env-file .env.development \
  -f compose.development.yaml \
  up -d postgres

npm run db:migrate
npm run db:seed:test
npm run dev
```

Повторный запуск полностью в Docker:

```bash
npm run dev:docker:up
```

В другом терминале:

```bash
npm run db:migrate:development:docker
npm run db:seed:test
```

Скрипт написан для POSIX shell. В Windows используйте WSL или совместимую shell
среду.

## Диагностика

### PostgreSQL не принимает соединение

Проверьте состояние:

```bash
docker compose \
  --env-file .env.development \
  -f compose.development.yaml \
  ps
```

Проверьте логи:

```bash
docker compose \
  --env-file .env.development \
  -f compose.development.yaml \
  logs postgres
```

Убедитесь, что `POSTGRES_PORT` совпадает с портом в `DATABASE_URL` при запуске
приложения на хосте.

### `getaddrinfo ENOTFOUND postgres`

`postgres` является hostname только внутри Compose network. При локальном
запуске приложения используйте:

```dotenv
DATABASE_URL=postgres://notification_service:notification_service@127.0.0.1:5433/notification_preferences
```

### `ECONNREFUSED 127.0.0.1:5433`

Проверьте:

- запущен ли контейнер PostgreSQL;
- опубликован ли порт `5433`;
- установлено ли `POSTGRES_PORT=5433`;
- использует ли `DATABASE_URL` тот же порт.

### `relation ... does not exist`

Миграции не применены.

Для локального запуска:

```bash
npm run db:migrate
```

Для development Compose:

```bash
npm run db:migrate:development:docker
```

### Seed не подключается к PostgreSQL

Seed runner всегда использует `127.0.0.1:${POSTGRES_PORT}` и не использует
hostname из `DATABASE_URL`.

Проверьте, что PostgreSQL опубликован на хосте и `POSTGRES_PORT` соответствует
Compose mapping.

### App-контейнер доступен не на том порте

В Compose:

- `PORT=3000` — внутренний порт процесса;
- `APP_PORT` — внешний порт хоста.

Например:

```dotenv
PORT=3000
APP_PORT=8080
```

Тогда приложение доступно на `http://localhost:8080`.

### Production container перезапускается

Посмотрите логи:

```bash
docker compose \
  --env-file .env.production \
  -f compose.production.yaml \
  logs app
```

Production entrypoint завершает контейнер при ошибке миграции, потому что
использует `set -eu`.

## Текущие ограничения

- отсутствуют authentication и authorization;
- административные маршруты публичны;
- `userId` не валидируется через внешний User Service;
- нет API управления `default_preferences`;
- нет фоновой очистки истёкших `idempotency_records`;
- `/health` не проверяет PostgreSQL;
- отсутствуют rate limiting, metrics и distributed tracing;
- отсутствует audit log административных изменений;
- production migrations выполняются при старте app container, а не отдельным
  deployment job;
- отсутствует кэширование справочников и политик;
- Swagger UI не ограничен в production;
- integration suite тестирует сервисный слой, но не полный HTTP contract.

## License

ISC.
