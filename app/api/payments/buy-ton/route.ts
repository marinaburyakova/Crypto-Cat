// app/api/payments/buy-ton/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount } = body

    // 1. ✅ Валидация входных данных
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid userId' },
        { status: 400 }
      )
    }

    if (!amount || typeof amount !== 'number' || amount <= 0 || amount > 10000) {
      return NextResponse.json(
        { error: 'Invalid amount (must be 1-10000)' },
        { status: 400 }
      )
    }

    // 2. ✅ Проверка пользователя
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

    // 3. ✅ Настройки TON
    const merchantWallet = process.env.MERCHANT_WALLET_ADDRESS
    const isTestnet = process.env.TON_NETWORK === 'testnet'

    if (!merchantWallet) {
      console.error('❌ MERCHANT_WALLET_ADDRESS is missing')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // 4. ✅ Создаём заказ в БД
    const order = await prisma.transaction.create({
      data: {
        userId: userId,
        amount: amount * 0.5, // 0.5 TON за 1 энергию
        currency: 'TON',
        status: 'PENDING',
        payload: `ton_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        sku: 'energy',
        itemName: `${amount} энергии`,
      },
    })

    // 5. ✅ Уникальный комментарий для отслеживания
    const comment = `order:${order.id}|user:${userId}`

    // 6. ✅ Расчёт суммы в NanoTON
    const tonAmount = amount * 0.5 // 0.5 TON за 1 энергию
    const nanoAmount = Math.round(tonAmount * 1_000_000_000)

    // 7. ✅ Выбор правильного протокола
    // Для тестнета используем ton-testnet://, для мейннета ton://
    const protocol = isTestnet ? 'ton-testnet' : 'ton'

    // 8. ✅ Ссылка для Tonkeeper
    const paymentLink = `${protocol}://transfer/${merchantWallet}?amount=${nanoAmount}&text=${encodeURIComponent(comment)}`

    console.log('🔗 TON payment link generated:', {
      userId,
      amount,
      tonAmount,
      comment,
      isTestnet,
      orderId: order.id,
    })

    return NextResponse.json({
      success: true,
      paymentLink: paymentLink,
      amount: tonAmount,
      merchantWallet: merchantWallet,
      isTestnet: isTestnet,
      comment: comment,
      orderId: order.id,
    })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}