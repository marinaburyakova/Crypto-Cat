// app/api/payments/stars-invoice/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // ← Исправлен импорт
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { userId, itemPriceStars, itemSku, itemName } = await req.json();

    // Валидация
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }
    if (!itemPriceStars || isNaN(parseInt(itemPriceStars, 10))) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }
    if (!itemSku || typeof itemSku !== 'string') {
      return NextResponse.json({ error: 'Invalid SKU' }, { status: 400 });
    }
    if (!itemName || typeof itemName !== 'string') {
      return NextResponse.json({ error: 'Invalid item name' }, { status: 400 });
    }

    const uniquePayload = `stars_${itemSku}_${crypto.randomBytes(4).toString('hex')}`;

    // Транзакция для атомарности
    const result = await prisma.$transaction(async (tx) => {
      // Гарантируем наличие пользователя в базе данных
      await tx.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          points: 0,
          unclaimedPoints: 0,
          level: 1,
          passiveRate: 0
        }
      });

      // Создаем транзакцию
      await tx.transaction.create({
        data: {
          userId,
          amount: parseFloat(itemPriceStars),
          currency: 'STARS',
          payload: uniquePayload,
          status: 'PENDING'
        }
      });
    });

    // Извлекаем токен и очищаем
    const rawToken = process.env.TELEGRAM_BOT_TOKEN || '';
    const botToken = rawToken.replace(/[\r\n\t ]/g, '');

    if (!botToken) {
      return NextResponse.json(
        { error: 'Bot token not configured' }, 
        { status: 500 }
      );
    }

    const tgUrl = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;

    const response = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: itemName,
        description: `Покупка: ${itemName}`,
        payload: uniquePayload,
        provider_token: "",
        currency: "XTR",
        prices: [{ label: itemName, amount: parseInt(itemPriceStars, 10) }]
      })
    });

    const data = await response.json();

    // ✅ ИСПРАВЛЕНО: правильная проверка
    if (!data.result) {
      console.error('Telegram API error:', data);
      return NextResponse.json(
        { error: data.description || 'Invoice creation failed' }, 
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      invoiceLink: data.result,
      payload: uniquePayload
    });

  } catch (error) {
    console.error('Stars invoice error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}