
FROM node:20-alpine AS builder
WORKDIR /app

ARG DATABASE_URL
ARG REDIS_URL
ARG GIGACHAT_CREDENTIALS
ARG GIGACHAT_SCOPE
ARG NODE_TLS_REJECT_UNAUTHORIZED
ARG TELEGRAM_BOT_TOKEN
ARG MERCHANT_WALLET_ADDRESS
ARG TON_RPC_ENDPOINT

ENV DATABASE_URL=${DATABASE_URL} \
    REDIS_URL=${REDIS_URL} \
    GIGACHAT_CREDENTIALS=${GIGACHAT_CREDENTIALS} \
    GIGACHAT_SCOPE=${GIGACHAT_SCOPE} \
    NODE_TLS_REJECT_UNAUTHORIZED=${NODE_TLS_REJECT_UNAUTHORIZED} \
    TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN} \
    MERCHANT_WALLET_ADDRESS=${MERCHANT_WALLET_ADDRESS} \
    TON_RPC_ENDPOINT=${TON_RPC_ENDPOINT} \
    NODE_OPTIONS="--max-old-space-size=512"


COPY package*.json ./
RUN npm ci


COPY . .
RUN npx prisma generate


RUN npm run build



FROM node:20-alpine AS runner-deps
WORKDIR /app
COPY package*.json ./

RUN npm ci --only=production --omit=dev



FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production


COPY --from=runner-deps /app/node_modules ./node_modules

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client


COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
