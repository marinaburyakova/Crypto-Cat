// app/api/payments/ton/create-invoice/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, sku, itemName } = await request.json()

    console.log('📦 TON invoice request:', { userId, amount, sku, itemName })

    if (!userId || !amount || !sku) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 🔥 Проверяем, существует ли пользователь
    let user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      console.log('👤 Пользователь не найден, создаём:', userId)
      user = await prisma.user.create({
        data: {
          id: userId,
          login: userId,
          points: 0,
          energy: 1000,
          maxEnergy: 1000,
          level: 1,
          exp: 0,
          skin: 'default',
        },
      })
    }

    // 🔥 Берём адрес из переменной окружения
    const walletAddress = process.env.MERCHANT_WALLET_ADDRESS
    console.log('💰 Wallet address:', walletAddress)

    if (!walletAddress) {
      console.error('❌ MERCHANT_WALLET_ADDRESS not set')
      return NextResponse.json(
        { success: false, error: 'Payment system not configured' },
        { status: 500 }
      )
    }

    // Генерируем уникальный payload
    const payload = `ton_${Date.now()}_${userId}_${Math.random().toString(36).substr(2, 6)}`

    // Сохраняем транзакцию в БД
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: parseFloat(amount),
        currency: 'TON',
        status: 'PENDING',
        payload,
        sku,
        itemName: itemName || sku,
        metadata: {
          userId,
          sku,
          itemName,
          walletAddress,
        },
      },
    })

    console.log('✅ TON transaction created:', transaction.id)

    // 🔥 Формируем ссылку для TON кошелька (Testnet)
    const amountNano = parseFloat(amount) * 1000000000
    const network = process.env.TON_NETWORK || 'mainnet'
    
    // Для Testnet адрес должен начинаться с 0Q или kQ
    const tonUri = `ton://transfer/${walletAddress}?amount=${amountNano}&memo=${payload}`

    console.log('🔗 tonUri:', tonUri)

    return NextResponse.json({
      success: true,
      tonUri,
      payload,
      transactionId: transaction.id,
      walletAddress,
    })

  } catch (error) {
    console.error('❌ TON invoice error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}