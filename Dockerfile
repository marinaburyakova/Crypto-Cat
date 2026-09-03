# ---- Билдер (Builder) ----
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# 1. Копируем package.json и prisma схему
COPY package*.json ./
COPY prisma ./prisma/

# 2. Объявляем аргументы (передаются из GitHub Actions)
ARG DATABASE_URL
ARG REDIS_URL
ARG GIGACHAT_CREDENTIALS
ARG GIGACHAT_SCOPE
ARG NODE_TLS_REJECT_UNAUTHORIZED
ARG TELEGRAM_BOT_TOKEN
ARG MERCHANT_WALLET_ADDRESS
ARG TON_RPC_ENDPOINT

# 3. Превращаем ARG в ENV (чтобы были видны при сборке)
ENV DATABASE_URL=$DATABASE_URL
ENV REDIS_URL=$REDIS_URL
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# 4. Устанавливаем зависимости и генерируем Prisma Client
RUN npm ci --only=production && npm cache clean --force

# 5. Генерируем Prisma Client (теперь DATABASE_URL доступен)
RUN npx prisma generate

# 6. Копируем остальной код
COPY . .

# 7. Собираем Next.js
RUN npm run build

# ---- Финальный образ (Runner) ----
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Копируем результат сборки из билдера
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

# Очищаем кэш
RUN rm -rf /app/node_modules/.cache

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

EXPOSE 3000

# Запускаем приложение
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]