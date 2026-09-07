import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PRODUCTS } from '@/config/products'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, itemSku } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
    }

    let finalTonAmount = 0
    let sku = 'energy'
    let itemName = ''

    if (itemSku) {
      let lookupSku = itemSku

      // Фолбеки для старых модалок бустов
      if (lookupSku === 'speed' || lookupSku === 'boost_speed' || lookupSku === 'energy_boost' || lookupSku === 'level_up') lookupSku = 'level_boost'
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

      finalTonAmount = product.priceTon
      sku = product.id
      itemName = product.name
    } else {
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
      finalTonAmount = amount * 0.5
      sku = 'energy'
      itemName = `${amount} energies`
    }

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

    const merchantWallet = process.env.MERCHANT_WALLET_ADDRESS

    // 🌐 АВТОМАТИЧЕСКОЕ ОПРЕДЕЛЕНИЕ СЕТИ ИЗ .ENV (Не меняйте код для продакшена!)
    const isTestnet = process.env.TON_NETWORK === 'testnet'
    const rpcEndpoint =
      process.env.TON_RPC_ENDPOINT || 'https://toncenter.com/api/v2/jsonRPC'

    if (!merchantWallet) {
      console.error('❌ MERCHANT_WALLET_ADDRESS is missing')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      )
    }

    const generatedPayload = `ton_${sku === 'energy' ? 'energy' : 'product'}_${sku}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`

    const order = await prisma.transaction.create({
      data: {
        userId: userId,
        amount: finalTonAmount,
        currency: 'TON',
        status: 'PENDING',
        payload: generatedPayload,
        sku: sku,
        itemName: itemName,
      },
    })

    const comment = `order:${order.id}|user:${userId}`
    const nanoAmount = Math.round(finalTonAmount * 1_000_000_000)

    // 📲 Настройка протокола ссылки под выбранную сеть
    // Для тестнета сформирует: ton-testnet://transfer/... (заставит Tonkeeper переключиться в Testnet)
    // Для продакшена сформирует: ton://transfer/...
    const protocol = isTestnet ? 'ton-testnet' : 'ton'
    const paymentLink = `${protocol}://transfer/${merchantWallet}?amount=${nanoAmount}&text=${encodeURIComponent(comment)}`

    console.log(`📡 TON Network Mode: ${isTestnet ? 'TESTNET' : 'MAINNET'}`)
    console.log(`🔗 RPC Endpoint: ${rpcEndpoint}`)

    return NextResponse.json({
      success: true,
      paymentLink: paymentLink,
      invoiceLink: paymentLink,
      payload: generatedPayload,
      amount: finalTonAmount,
      merchantWallet: merchantWallet,
      isTestnet: isTestnet,
      comment: comment,
      orderId: order.id,
    })
  } catch (error) {
    console.error('❌ Error in /api/payments/buy-ton:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
