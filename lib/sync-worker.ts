// lib/sync-worker.ts
import { redis } from '@lib/redis';
import { prisma } from '@lib/prisma';

let isSyncing = false;

export function initSyncWorker() {
  // Запускаем фоновый цикл синхронизации каждые 10 секунд
  setInterval(async () => {
    if (isSyncing) return; // Защита от наложения циклов, если база данных перегружена
    isSyncing = true;

    try {
      // 1. Получаем список всех пользователей, у которых изменился баланс
      const pendingUsers = await redis.smembers('users:pending_sync');
      if (pendingUsers.length === 0) {
        isSyncing = false;
        return;
      }

      // 2. Формируем пакетные запросы (Batching) для Prisma 7
      const updates = pendingUsers.map(async (userId) => {
        const redisUserKey = `user:${userId}:state`;
        
        // Извлекаем накопленные несинхронизированные поинты
        const uncommittedStr = await redis.hget(redisUserKey, 'uncommitted_points');
        const totalPointsStr = await redis.hget(redisUserKey, 'points');
        
        const uncommitted = parseInt(uncommittedStr || '0', 10);
        const totalPoints = parseInt(totalPointsStr || '0', 10);

        if (uncommitted > 0) {
          // Обновляем PostgreSQL через транзакцию Prisma
          await prisma.user.upsert({
            where: { id: userId },
            update: {
              points: totalPoints,
              unclaimedPoints: { increment: uncommitted }
            },
            create: {
              id: userId,
              points: totalPoints,
              unclaimedPoints: uncommitted,
              level: 1,
              passiveRate: 0
            }
          });

          // Сбрасываем буфер несинхронизированных очков в Redis
          await redis.hincrby(redisUserKey, 'uncommitted_points', -uncommitted);
        }
        
        // Удаляем пользователя из очереди на синхронизацию
        await redis.srem('users:pending_sync', userId);
      });

      // Выполняем все обновления параллельно в рамках одного тика воркера
      await Promise.all(updates);

    } catch (error) {
      console.error('Ошибка фоновой синхронизации воркера:', error);
    } finally {
      isSyncing = false;
    }
  }, 10000); // 10000 мс = 10 секунд
}
