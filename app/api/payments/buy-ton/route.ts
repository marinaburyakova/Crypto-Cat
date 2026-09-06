// app/api/payments/buy-ton/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, itemName, itemSku, price, data } = body

    console.log('📦 Buy TON request:', { userId, type, itemName, price })

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type' },
        { status: 400 },
      )
    }

    // ✅ Автоматически создаём пользователя, если его нет
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

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const isTestnet = process.env.TON_NETWORK === 'testnet'

    let payload = `ton_${type}_${userId}_${Date.now()}`
    let description = itemName || 'Покупка в магазине'

    if (type === 'energy') {
      payload = `ton_energy_${data.amount}_${userId}_${Date.now()}`
      description = `${data.amount} энергии за TON`
    } else if (type === 'boost') {
      payload = `ton_boost_${data.effect}_${data.value}_${userId}_${Date.now()}`
      description = `Буст: ${data.effect} +${data.value} за TON`
    } else if (type === 'level') {
      payload = `ton_level_${data.value}_${userId}_${Date.now()}`
      description = `Повышение уровня +${data.value} за TON`
    } else if (type === 'vip') {
      payload = `ton_vip_${data.value}_${userId}_${Date.now()}`
      description = `VIP на ${data.value} дней за TON`
    }

    // 1 TON = 1,000,000,000 нано-TON
    const tonAmount = Math.round(parseFloat(price) * 1000000000)

    const invoiceParams: any = {
      title: itemName || 'Покупка за TON',
      description: description,
      payload: payload,
      currency: 'TON',
      prices: [{ label: itemName || 'Товар', amount: tonAmount }],
    }

    // Для тестнета добавляем test: true
    if (isTestnet) {
      invoiceParams.test = true
      console.log('🧪 TON Testnet mode enabled')
    }

    // 🔥 Создаём инвойс в Telegram за TON
    const invoiceResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceParams),
      },
    )

    const invoiceData = await invoiceResponse.json()

    if (!invoiceData.ok) {
      console.error('❌ Telegram TON invoice error:', invoiceData)
      return NextResponse.json(
        { error: 'Failed to create TON invoice' },
        { status: 500 },
      )
    }

    // Сохраняем транзакцию
    await prisma.transaction.create({
      data: {
        userId,
        amount: parseFloat(price),
        currency: 'TON',
        status: 'PENDING',
        payload: payload,
        sku: itemSku,
        itemName: itemName,
        metadata: { type, data, isTestnet },
      },
    })

    console.log('✅ TON invoice created for user:', userId)

    return NextResponse.json({
      success: true,
      invoiceLink: invoiceData.result,
      payload: payload,
    })
  } catch (error) {
    console.error('❌ Buy TON error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
