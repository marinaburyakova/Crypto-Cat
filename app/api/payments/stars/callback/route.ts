// app/api/payments/stars/callback/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // 1. Стадия проверки доступности товара перед списанием (PreCheckout)
    if (update.pre_checkout_query) {
      const preCheckoutId = update.pre_checkout_query.id;
      
      // Отвечаем Telegram, что товар в наличии и всё ОК
      await fetch(`https://telegram.org{botToken}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: preCheckoutId,
          ok: true
        })
      });
      return NextResponse.json({ ok: true });
    }

    // 2. Стадия успешного завершения платежа (Successful Payment)
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const uniquePayload = payment.invoice_payload;
      const tgUserId = update.message.from.id.toString();

      // Проверяем, существует ли такая PENDING транзакция
      const pendingTx = await prisma.transaction.findFirst({
        where: { payload: uniquePayload, status: 'PENDING' }
      });

      if (pendingTx) {
        // Проводим транзакцию в базе данных
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: pendingTx.id },
            data: { status: 'SUCCESS' }
          }),
          prisma.user.update({
            where: { id: pendingTx.userId },
            // В качестве награды увеличиваем уровень RPG-кота на +1 за Stars
            data: { level: { increment: 1 } }
          })
        ]);
        console.log(`[STARS] Успешно обработана оплата для payload: ${uniquePayload}`);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Ошибка обработки Вебхука Telegram Stars:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
