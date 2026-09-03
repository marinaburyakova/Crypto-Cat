FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

ARG DATABASE_URL
ARG REDIS_URL
ARG GIGACHAT_CREDENTIALS
ARG GIGACHAT_SCOPE
ARG NODE_TLS_REJECT_UNAUTHORIZED
ARG TELEGRAM_BOT_TOKEN
ARG MERCHANT_WALLET_ADDRESS
ARG TON_RPC_ENDPOINT

ENV DATABASE_URL=$DATABASE_URL
ENV REDIS_URL=$REDIS_URL
ENV GIGACHAT_CREDENTIALS=$GIGACHAT_CREDENTIALS
ENV GIGACHAT_SCOPE=$GIGACHAT_SCOPE
ENV NODE_TLS_REJECT_UNAUTHORIZED=$NODE_TLS_REJECT_UNAUTHORIZED
ENV TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
ENV MERCHANT_WALLET_ADDRESS=$MERCHANT_WALLET_ADDRESS
ENV TON_RPC_ENDPOINT=$TON_RPC_ENDPOINT
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache openssl

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