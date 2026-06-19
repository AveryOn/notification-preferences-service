FROM node:24-bookworm-slim AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY .husky/install.mjs ./.husky/install.mjs

RUN npm ci


FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json tsup.config.ts ./
COPY src ./src

RUN npm run build


FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY .husky/install.mjs ./.husky/install.mjs

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY drizzle ./drizzle
COPY docker-entrypoint.sh ./scripts/docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

USER node

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]

CMD ["node", "dist/main.js"]
