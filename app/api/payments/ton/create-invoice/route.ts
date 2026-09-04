// app/api/payments/ton/create-invoice/route.ts
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
    if (!product.priceTon) {
      return NextResponse.json(
        { error: 'Product not available for TON' },
        { status: 400 }
      )
    }

    // ✅ Принудительно приводим к number
    const priceTon: number = Number(product.priceTon)
    if (isNaN(priceTon) || priceTon <= 0) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      )
    }

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      return NextResponse.json(
        { error: 'Merchant address not configured' },
        { status: 500 }
      )
    }

    const memo = `ton_${productId}_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`

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
          amount: priceTon, // ✅ теперь точно number
          currency: 'TON',
          payload: memo,
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

    const nanoAmount = BigInt(
      Math.round(priceTon * 1_000_000_000)
    ).toString()

    const tonUri = `ton://transfer/${merchantAddress}?amount=${nanoAmount}&text=${encodeURIComponent(memo)}`

    return NextResponse.json({
      success: true,
      tonUri,
      memo,
      productId,
    })

  } catch (error) {
    console.error('❌ TON invoice error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}