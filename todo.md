# План задачи: Notification Preferences Service

> Решил вести здесь простой todo лист чтобы проще было двигаться по этапам

## Tech Stack:

- Node.js v24
- Typescript
- Express.js
- PostgreSQL
- Drizzle ORM
- Swagger/OpenAPI
- dotenv + Zod vaidation
- Docker
- Pino (для логгирования)
- Vitest
- Testcontainers (интеграционные тесты для PostgreSQL)
- Luxon или date-fns-tz (для работы с quiet hours и IANA timezone)
- ESLint + Prettier

## GitHub:

<!-- - создать репозиторий -->
<!-- - Написать комментарий в репозитории гитхаба, -->
<!-- - проставить теги -->
<!-- - выделить ветки main и dev -->
<!-- - придерживаться git flow при работе -->

## Developer Experience:

<!-- - .nvmrc -->
<!-- - .gitigonre -->
<!-- - Typescript + tsx -->
<!-- - ESM бандлер + Режим проекта - ESM -->
<!-- - HMR + dev сервер -->
<!-- - editorconfig -->

<!-- - EsLint -->
<!-- - formatter (prettier) -->
<!-- - vscode settings file (сохранение + форматироввание по ctrl + s) -->
<!-- - git-хуки для безопасности CI -->

<!-- - env.example + zod валидацию переменных -->
  <!-- - import aliases -->
  <!-- - Docker окружение -->

- окружения тестирование под Vitest

## Express Server:

- настроить CORS с учетом окружения (dev | prod)
- настроить urlencoded + body parser мидлвары
- настроить helmet (также активация по флагу isProduction)
- настроить trust proxy для работы за reverse proxy

## Развертываение первого архитектурного среза

Здесь важно продумать архитектуру которая позволит отделить домен от инфраструктуры и транспорта

- развернуть первые 2 тестовых модуля
- написать собственный простой DI decorator

## Logger:

- Создать core модуль - logger слой:
  - модуль, порт, реализацию (пока просто файлы)
  - написать реализацию с использованием chalk для выделения уровней логов в dev и local среде
  - встроить логгер в общее дерево зависимостей как глобальную зависимость
