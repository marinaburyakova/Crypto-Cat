// app/api/payments/stars/create-invoice/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getProduct } from '@/config/products'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { userId, productId } = await req.json()

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'Missing userId or productId' },
        { status: 400 }
      )
    }

    const product = getProduct(productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // ✅ Проверяем, что цена существует
    if (!product.priceStars) {
      return NextResponse.json(
        { error: 'Product not available for Stars' },
        { status: 400 }
      )
    }

    // ✅ Принудительно приводим к number
    const priceStars: number = Number(product.priceStars)
    if (isNaN(priceStars) || priceStars <= 0) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      )
    }

    const payload = `stars_${productId}_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`

    await prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          points: 0,
          unclaimedPoints: 0,
          level: 1,
          passiveRate: 0,
          energy: 1000,
          maxEnergy: 1000,
        },
      })

      await tx.transaction.create({
        data: {
          userId,
          amount: priceStars, // ✅ теперь точно number
          currency: 'STARS',
          payload,
          sku: productId,
          itemName: product.name,
          status: 'PENDING',
          metadata: {
            productId,
            effect: product.effect,
            effectValue: product.effectValue,
          },
        },
      })
    })

    const botToken = process.env.TELEGRAM_BOT_TOKEN?.replace(/[\r\n\t ]/g, '')
    if (!botToken) {
      return NextResponse.json(
        { error: 'Bot token not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: product.name,
          description: product.description,
          payload,
          provider_token: '',
          currency: 'XTR',
          prices: [{ label: product.name, amount: priceStars }],
        }),
      }
    )

    const data = await response.json()

    if (!data.result) {
      console.error('Telegram API error:', data)
      return NextResponse.json(
        { error: data.description || 'Failed to create invoice' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      invoiceLink: data.result,
      payload,
      productId,
    })

  } catch (error) {
    console.error('❌ Stars invoice error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}