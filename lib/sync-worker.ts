// lib/sync-worker.ts
import { safeRedis, isRedisAvailable } from '@lib/redis';
import { prisma } from '@lib/prisma';

let isSyncing = false;

export async function syncWorker() {
  if (isSyncing) return;
  
  // Проверяем доступность Redis
  const redisAvailable = await isRedisAvailable();
  if (!redisAvailable) {
    console.warn('⚠️ Redis not available, skipping sync');
    return;
  }

  isSyncing = true;

  try {
    // Получаем список всех пользователей, у которых изменились данные
    const pendingUsers = await safeRedis.smembers('users:pending_sync');
    
    if (!pendingUsers || pendingUsers.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`🔄 Syncing ${pendingUsers.length} users...`);

    for (const userId of pendingUsers) {
      try {
        // Получаем данные пользователя из Redis
        const userData = await safeRedis.hgetall(`user:${userId}`);
        
        if (userData && Object.keys(userData).length > 0) {
          // Сохраняем в PostgreSQL
          await prisma.user.upsert({
            where: { id: userId },
            update: {
              points: parseInt(userData.points || '0'),
              energy: parseInt(userData.energy || '1000'),
              maxEnergy: parseInt(userData.maxEnergy || '1000'),
              level: parseInt(userData.level || '1'),
              exp: parseInt(userData.exp || '0'),
              updatedAt: new Date(),
            },
            create: {
              id: userId,
              points: parseInt(userData.points || '0'),
              energy: parseInt(userData.energy || '1000'),
              maxEnergy: parseInt(userData.maxEnergy || '1000'),
              level: parseInt(userData.level || '1'),
              exp: parseInt(userData.exp || '0'),
            },
          });
        }

        // Удаляем из списка на синхронизацию
        await safeRedis.srem('users:pending_sync', userId);
      } catch (error) {
        console.error(`❌ Error syncing user ${userId}:`, error);
      }
    }

    console.log('✅ Sync completed');
  } catch (error) {
    console.error('❌ Sync worker error:', error);
  } finally {
    isSyncing = false;
  }
}

// Запускаем синхронизацию каждые 30 секунд только в production
if (process.env.NODE_ENV === 'production') {
  // Первый запуск с задержкой
  setTimeout(syncWorker, 5000);
  
  // Периодический запуск
  setInterval(syncWorker, 30000);
}