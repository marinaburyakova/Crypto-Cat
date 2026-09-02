// instrumentation.ts
export async function register() {
  // Проверяем, что код выполняется строго на серверной стороне Node.js рантайма
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initSyncWorker } = await import('@lib/sync-worker');
    const { initTonPaymentWorker } = await import('@lib/ton-worker');
    
    initSyncWorker();
    initTonPaymentWorker();
    console.log('🏁 [SYSTEM] Все фоновые воркеры (Клик-агрегатор и TON-валидатор) успешно запущены.');
  }
}
