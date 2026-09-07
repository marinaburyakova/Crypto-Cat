import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PRODUCTS } from '@/config/products'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, itemSku } = body

    console.log('📦 Buy Stars request:', { userId, amount, itemSku })

    // 1. ✅ Валидация входных данных
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
    }

    let invoiceTitle = ''
    let invoiceDescription = ''
    let sku = 'energy'
    let starsPrice = 0

    // 2. ✅ Нормализация SKU и цен
    if (itemSku) {
      let lookupSku = itemSku

      // Фолбеки для совместимости со старыми компонентами модалок
      if (
        lookupSku === 'speed' ||
        lookupSku === 'boost_speed' ||
        lookupSku === 'energy_boost' ||
        lookupSku === 'level_up'
      ) {
        lookupSku = 'level_boost'
      }
      if (
        lookupSku === 'multiplier' ||
        lookupSku === 'boost_multiplier' ||
        lookupSku === 'energy_boost_big'
      ) {
        lookupSku = 'level_boost_big'
      }
      if (lookupSku === 'passive' || lookupSku === 'boost_passive') {
        lookupSku = 'vip_7days'
      }
      if (lookupSku === 'max_energy' || lookupSku === 'boost_max_energy') {
        lookupSku = 'energy_1000'
      }

      const product = PRODUCTS.find((p) => p.id === lookupSku)
      if (!product) {
        return NextResponse.json(
          { error: `Product not found (SKU: ${itemSku})` },
          { status: 404 },
        )
      }
      invoiceTitle = product.name
      invoiceDescription = product.description
      sku = product.id
      starsPrice = product.priceStars
    } else {
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
      }
      invoiceTitle = `${amount} энергии`
      invoiceDescription = `Покупка ${amount} энергии`
      sku = 'energy'
      starsPrice = amount
    }

    if (starsPrice < 1 || starsPrice > 10000) {
      return NextResponse.json(
        { error: 'Telegram Stars amount must be between 1 and 10000' },
        { status: 400 },
      )
    }

    // 3. ✅ Идемпотентный upsert пользователя (защита от Race Condition)
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

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN is missing')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      )
    }

    // 4. ✅ Формируем гарантированно уникальный хэш без использования внешнего модуля crypto
    const randomHash = Math.random().toString(36).substring(2, 10)
    const generatedPayload = `stars_${sku === 'energy' ? 'energy' : 'product'}_${sku}_${userId}_${Date.now()}_${randomHash}`

    // 5. ✅ Создаём запись транзакции в Prisma СУБД (Статус PENDING)
    const order = await prisma.transaction.create({
      data: {
        userId: userId,
        amount: parseFloat(starsPrice.toString()),
        currency: 'STARS',
        status: 'PENDING',
        payload: generatedPayload,
        sku: sku,
        itemName: invoiceTitle,
      },
    })

    // 6. ✅ Запрос ссылки-инвойса у официального Bot API Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: invoiceTitle,
          description: invoiceDescription,
          payload: generatedPayload,
          provider_token: '', // Пусто для Telegram Stars (XTR)
          currency: 'XTR',
          prices: [{ label: invoiceTitle, amount: starsPrice }],
        }),
      },
    )

    const data = await response.json()

    if (!data.ok) {
      console.error('❌ Telegram API Error:', data)
      return NextResponse.json(
        { error: data.description || 'Payment error' },
        { status: 400 },
      )
    }

    console.log('✅ Stars Invoice created:', data.result)

    return NextResponse.json({
      success: true,
      invoiceLink: data.result,
      payload: generatedPayload,
      orderId: order.id,
    })
  } catch (error) {
    console.error('❌ Critical error in buy-stars:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
