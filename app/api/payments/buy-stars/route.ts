// app/api/payments/buy-stars/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount } = body

    // 1. ✅ Валидация входных данных
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
    }

    if (
      !amount ||
      typeof amount !== 'number' ||
      amount <= 0 ||
      amount > 10000
    ) {
      return NextResponse.json(
        { error: 'Invalid amount (must be 1-10000)' },
        { status: 400 },
      )
    }

    // 2. ✅ Проверка пользователя (или создание)
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        login: userId,
        points: 0,
        energy: 1000,
        maxEnergy: 1000,
        level: 1,
        exp: 0,
        passiveRate: 0,
        skin: 'default',
      },
    })

    // 3. ✅ Проверка токена бота
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN is missing')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      )
    }

    // 4. ✅ Создаём заказ в БД (для трекинга)
    const order = await prisma.transaction.create({
      data: {
        userId: userId,
        amount: amount,
        currency: 'STARS',
        status: 'PENDING',
        payload: `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sku: 'energy',
        itemName: `${amount} энергии`,
      },
    })

    // 5. ✅ Запрос к Telegram API (правильный!)
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${amount} энергии`,
          description: `Покупка ${amount} единиц энергии`,
          payload: order.payload, // ← только orderId
          provider_token: '', // ✅ явно пустая строка
          currency: 'XTR',
          prices: [
            {
              label: 'Энергия',
              amount: amount, // ✅ БЕЗ множителя! 50 Stars = 50
            },
          ],
        }),
      },
    )

    const data = await response.json()

    if (!data.ok) {
      console.error('❌ Telegram API Error:', data)

      // Отменяем заказ
      await prisma.transaction.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      })

      return NextResponse.json(
        { error: data.description || 'Payment error' },
        { status: 400 },
      )
    }

    // ✅ Успешно
    return NextResponse.json({
      success: true,
      invoiceLink: data.result,
      orderId: order.id,
    })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
