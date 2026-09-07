import { TonClient } from '@ton/ton';
import { Address } from '@ton/core';
import { prisma } from './prisma'; // Убедитесь в правильности пути к вашему prisma-файлу
import { PRODUCTS } from '@/config/products';

let isChecking = false;

export function initTonPaymentWorker() {
  const endpoint = process.env.TON_RPC_ENDPOINT?.trim();
  const walletAddressStr = process.env.MERCHANT_WALLET_ADDRESS?.trim();

  if (!endpoint || !walletAddressStr) return;

  const tonClient = new TonClient({ endpoint });
  let merchantAddress: Address;

  try {
    merchantAddress = Address.parse(walletAddressStr);
  } catch {
    return;
  }

  setInterval(async () => {
    if (isChecking) return;
    isChecking = true;

    try {
      // Запрашиваем последние транзакции кошелька из блокчейна TON
      const transactions = await tonClient.getTransactions(merchantAddress, { limit: 15 });

      for (const tx of transactions) {
        if (!tx.inMessage || !tx.inMessage.body) continue;

        let memoComment = '';
        try {
          const slice = tx.inMessage.body.beginParse();
          if (slice.remainingBits >= 32 && slice.preloadUint(32) === 0) {
            slice.skip(32);
            memoComment = slice.loadStringTail(); // Считываем текст комментария
          }
        } catch {
          continue; 
        }

        // Парсим наш комментарий формата "order:ORDER_ID|user:USER_ID"
        if (!memoComment.startsWith('order:')) continue;

        const orderId = memoComment.split('|')[0].split(':')[1];
        if (!orderId) continue;

        // Ищем транзакцию в БД по первичному ключу id
        const pendingInvoice = await prisma.transaction.findFirst({
          where: { id: orderId, status: 'PENDING' }
        });

        if (pendingInvoice) {
          console.log(`🎰 TON Worker found payment for order ${orderId}, SKU: ${pendingInvoice.sku}`);

          // Ищем характеристики купленного товара в PRODUCTS
          const product = PRODUCTS.find(p => p.id === pendingInvoice.sku);
          
          let userUpdateData: any = {};

          if (pendingInvoice.sku === 'energy') {
            userUpdateData = { energy: { increment: 500 } }; // Фолбек для ручной энергии
          } else if (product) {
            // Начисление в зависимости от категории товара из config/products.ts
            if (product.category === 'energy') {
              userUpdateData = { energy: { increment: Number(product.effectValue) } };
            } else if (product.category === 'level') {
              userUpdateData = { level: { increment: Number(product.effectValue) } };
            } else if (product.category === 'vip') {
              userUpdateData = { vipUntil: new Date(Date.now() + Number(product.effectValue) * 24 * 60 * 60 * 1000) };
            } else if (product.category === 'skin') {
              userUpdateData = { skin: String(product.effectValue) };
            }
          }

          // Выполняем атомарное обновление статуса заказа и баланса юзера
          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: pendingInvoice.id },
              data: { status: 'SUCCESS', completedAt: new Date(), applied: true }
            }),
            prisma.user.update({
              where: { id: pendingInvoice.userId },
              data: userUpdateData
            })
          ]);

          console.log(`✅ TON Worker successfully applied order ${orderId} to user ${pendingInvoice.userId}`);
        }
      }
    } catch (error) {
      // Игнорируем сетевые ошибки публичных RPC-нод, чтобы воркер не падал
      console.error('⚠️ TON Worker RPC Error:', error);
    } finally {
      isChecking = false;
    }
  }, 5000);
}
