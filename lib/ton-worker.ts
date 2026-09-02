// lib/ton-worker.ts
import { TonClient } from '@ton/ton';
import { Address } from '@ton/core';
import { prisma } from '@lib/prisma';

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
      const transactions = await tonClient.getTransactions(merchantAddress, { limit: 15 });

      for (const tx of transactions) {
        if (!tx.inMessage || !tx.inMessage.body) continue;

        let memoComment = '';
        try {
          const slice = tx.inMessage.body.beginParse();
          if (slice.remainingBits >= 32 && slice.preloadUint(32) === 0) {
            slice.skip(32);
            memoComment = slice.loadStringTail();
          }
        } catch {
          continue; 
        }

        if (!memoComment.startsWith('cat_')) continue;

        const pendingInvoice = await prisma.transaction.findFirst({
          where: { payload: memoComment, status: 'PENDING' }
        });

        if (pendingInvoice) {
          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: pendingInvoice.id },
              data: { status: 'SUCCESS' }
            }),
            prisma.user.update({
              where: { id: pendingInvoice.userId },
              data: { passiveRate: { increment: 50 } }
            })
          ]);
        }
      }
    } catch {
      // Игнорируем сетевые ошибки чтения публичной ноды
    } finally {
      isChecking = false;
    }
  }, 5000);
}
