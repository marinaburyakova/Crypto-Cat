import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PRODUCTS } from '@/config/products' // 👈 Импортируем ваш существующий конфиг
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, itemSku } = body

    console.log('📦 Buy Stars request:', { userId, amount, itemSku })

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
    }

    let invoiceTitle = ''
    let invoiceDescription = ''
    let sku = 'energy'
    let starsPrice = 0

    // Валидация товара по SKU из оригинального конфига PRODUCTS
    if (itemSku) {
      let lookupSku = itemSku

      // Маппинг старых или альтернативных id бустов на новые продукты
      if (lookupSku === 'speed' || lookupSku === 'boost_speed' || lookupSku === 'energy_boost' || lookupSku === 'level_up') lookupSku = 'level_boost'
      if (lookupSku === 'multiplier' || lookupSku === 'boost_multiplier' || lookupSku === 'energy_boost_big') lookupSku = 'level_boost_big'
      if (
        lookupSku === 'speed' ||
        lookupSku === 'boost_speed' ||
        lookupSku === 'energy_boost'
      )
        lookupSku = 'level_boost'
      if (lookupSku === 'multiplier' || lookupSku === 'boost_multiplier')
        lookupSku = 'level_boost_big'
      if (lookupSku === 'passive' || lookupSku === 'boost_passive')
        lookupSku = 'vip_7days'
      if (lookupSku === 'max_energy' || lookupSku === 'boost_max_energy')
        lookupSku = 'energy_1000'

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
      starsPrice = amount // 1 звезда = 1 энергия
    }

    if (starsPrice < 1 || starsPrice > 10000) {
      return NextResponse.json(
        { error: 'Telegram Stars amount must be between 1 and 10000' },
        { status: 400 },
      )
    }

    // Идемпотентный upsert пользователя
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

    // app/api/payments/buy-stars/route.ts

    // Добавляем crypto.randomBytes(4).toString('hex') в конец строки для 100% уникальности
    const generatedPayload = `stars_${sku === 'energy' ? 'energy' : 'product'}_${sku}_${userId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

    // Создаём транзакцию в СУБД Prisma
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

    const response = await fetch(
      `https://api.telegram.org{botToken}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: invoiceTitle,
          description: invoiceDescription,
          payload: generatedPayload,
          provider_token: '',
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
