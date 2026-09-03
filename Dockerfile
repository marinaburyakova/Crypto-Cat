FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Копируем только package.json для кэширования
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci --only=production && npm cache clean --force

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем код
COPY . .

# Собираем приложение
ENV NODE_ENV=production
RUN npm run build

# --- Финальный этап ---
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Копируем только необходимое
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

# Удаляем лишние файлы
RUN rm -rf /app/node_modules/.cache

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]