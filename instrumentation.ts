// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Проверяем доступность Redis перед запуском
      const { isRedisAvailable } = await import('@lib/redis');
      const available = await isRedisAvailable();
      
      if (available) {
        const { syncWorker } = await import('@lib/sync-worker');
        // Запускаем синхронизацию с задержкой
        setTimeout(syncWorker, 3000);
        console.log('✅ Sync worker initialized');
      } else {
        console.warn('⚠️ Redis not available, sync worker not started');
      }
    } catch (error) {
      console.error('❌ Failed to initialize sync worker:', error);
    }
  }
}