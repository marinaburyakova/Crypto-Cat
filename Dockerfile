FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate

COPY . .

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache openssl
ENV DATABASE_URL=${DATABASE_URL}
WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

RUN rm -rf /app/node_modules/.cache

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]