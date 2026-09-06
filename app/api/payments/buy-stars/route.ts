// app/api/payments/buy-stars/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount } = body

    console.log('📦 Buy Stars request:', { userId, amount })

    // 1. ✅ Валидация
    if (!userId || !amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid userId or amount' },
        { status: 400 }
      )
    }

    // 2. ✅ Создаём пользователя если нет
    await prisma.user.upsert({
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

    // 3. ✅ Проверяем токен
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN is missing')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // 4. ✅ Создаём инвойс в Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${amount} энергии`,
          description: `Покупка ${amount} энергии для вашего аккаунта`,
          payload: `energy_${userId}_${Date.now()}`,
          provider_token: '', // ✅ Явно пустая строка для Stars
          currency: 'XTR',
          prices: [{ 
            label: 'Энергия', 
            amount: amount // ✅ БЕЗ множителя! 5 Stars = 5
          }],
        }),
      }
    )

    const data = await response.json()

    if (!data.ok) {
      console.error('❌ Telegram API Error:', data)
      return NextResponse.json(
        { error: data.description || 'Payment error' },
        { status: 400 }
      )
    }

    console.log('✅ Invoice created:', data.result)

    return NextResponse.json({
      success: true,
      invoiceLink: data.result,
    })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}