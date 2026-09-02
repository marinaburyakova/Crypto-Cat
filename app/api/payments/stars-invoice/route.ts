// app/api/payments/stars-invoice/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { userId, itemPriceStars, itemSku, itemName } = await req.json();

    if (!userId || !itemPriceStars || !itemSku || !itemName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const uniquePayload = `stars_${itemSku}_${crypto.randomBytes(4).toString('hex')}`;

    // Гарантируем наличие пользователя в базе данных
    await prisma.user.upsert({
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

    await prisma.transaction.create({
      data: {
        userId,
        amount: parseFloat(itemPriceStars),
        currency: 'STARS',
        payload: uniquePayload,
        status: 'PENDING'
      }
    });

    // Извлекаем токен и принудительно очищаем его от пробелов и скрытых переносов строк \r\n
    const rawToken = process.env.TELEGRAM_BOT_TOKEN || '';
    const botToken = rawToken.replace(/[\r\n\t ]/g, ''); 

    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    // Полностью правильный, валидный по спецификации Telegram URL
    const tgUrl = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;

    const response = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: itemName,
        description: `Покупка: ${itemName}`,
        payload: uniquePayload,
        provider_token: "", // Для Stars строго пусто
        currency: "XTR",     // Валюта Telegram Stars строго XTR
        prices: [{ label: itemName, amount: parseInt(itemPriceStars, 10) }]
      })
    });

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.description || 'Invoice failed' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      invoiceLink: data.result,
      payload: uniquePayload
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
