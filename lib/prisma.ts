// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// 1. Создаем пулер соединений PostgreSQL, передавая строку из .env
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// 2. Инициализируем адаптер Prisma 7/8
const adapter = new PrismaPg(pool);

// 3. Создаем клиент. Больше никаких свойств `datasources` внутри быть не должно!
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter, // Адаптер пула сам управляет строкой подключения в рантайме
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
