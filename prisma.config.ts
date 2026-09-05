// prisma.config.ts
import { defineConfig } from 'prisma/config'
import dotenv from 'dotenv'

// Явно загружаем переменные из корня текущего рабочего процесса
dotenv.config() 

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Используем process.env с фолбеком на случай задержки чтения
    url: process.env.DATABASE_URL || '', 
  },
})
