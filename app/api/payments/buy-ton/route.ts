// app/api/payments/buy-ton/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Цены в TON
const TON_PRICES = {
  100: 0.5,
  500: 2.0,
  1000: 3.5,
  5000: 15.0,
} as const

type EnergyAmount = keyof typeof TON_PRICES

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, type = 'energy', itemName = 'Энергия' } = body

    console.log('📦 Buy TON request:', { userId, amount, type, itemName })

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount' },
        { status: 400 }
      )
    }

    if (userId === 'demo') {
      return NextResponse.json(
        { error: 'Демо-режим: покупка за TON недоступна' },
        { status: 403 }
      )
    }

    const tonPrice = TON_PRICES[amount as EnergyAmount]
    if (!tonPrice) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Проверяем пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 🔥 Получаем настройки TON
    const merchantWallet = process.env.MERCHANT_WALLET_ADDRESS
    const isTestnet = process.env.TON_NETWORK === 'testnet'

    if (!merchantWallet) {
      console.error('❌ MERCHANT_WALLET_ADDRESS not configured')
      return NextResponse.json(
        { error: 'Платежи за TON временно недоступны' },
        { status: 503 }
      )
    }

    // 🔥 Генерируем уникальный ID платежа
    const paymentId = `ton_${userId}_${amount}_${Date.now()}`
    const comment = `Energy ${amount}` // Будет видно в кошельке

    // 🔥 Формируем ссылку для Tonkeeper
    // Формат: ton://transfer/<адрес>?amount=<сумма>&comment=<комментарий>
    const tonAmount = tonPrice * 1000000000 // 1 TON = 10^9 нано-TON
    
    // 🔥 Кодируем комментарий в hex (TON требует hex для комментариев)
    const commentHex = Buffer.from(comment, 'utf-8').toString('hex')
    
    // 🔥 Ссылка для Tonkeeper
    const paymentLink = `ton://transfer/${merchantWallet}?amount=${tonAmount}&text=${comment}`

    // 🔥 Для тестнета используем другой формат ссылки
    const finalPaymentLink = isTestnet 
      ? `ton://transfer/${merchantWallet}?amount=${tonAmount}&text=${comment}&test=true`
      : paymentLink

    console.log('🔗 Payment link:', finalPaymentLink)
    console.log('💳 Payment ID:', paymentId)
    console.log('💰 Amount:', tonPrice, 'TON')
    console.log('📝 Comment:', comment)

    // 🔥 Сохраняем транзакцию в БД (статус PENDING)
    await prisma.transaction.create({
      data: {
        userId,
        amount: tonPrice,
        currency: 'TON',
        status: 'PENDING',
        payload: paymentId,
        sku: `energy_${amount}`,
        itemName: itemName,
        metadata: {
          amount,
          tonPrice,
          merchantWallet,
          comment,
          isTestnet,
          paymentLink: finalPaymentLink,
        },
      },
    })

    // 🔥 Возвращаем ссылку для оплаты
    return NextResponse.json({
      success: true,
      paymentId,
      amount: tonPrice,
      merchantWallet,
      comment,
      paymentLink: finalPaymentLink,
      isTestnet,
    })
  } catch (error) {
    console.error('❌ Buy TON error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}