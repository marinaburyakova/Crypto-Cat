// app/api/payments/energy/buy-ton/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { userId, amount } = await req.json()

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'Missing userId or amount' },
        { status: 400 }
      )
    }

    const energyAmount = Number(amount)
    if (isNaN(energyAmount) || energyAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Цены в TON
    const PRICES: Record<number, number> = {
      100: 0.5,
      500: 2.0,
      1000: 3.5,
      5000: 15.0,
    }

    const tonPrice = PRICES[energyAmount]
    if (!tonPrice) {
      return NextResponse.json(
        { error: 'Invalid energy amount' },
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

    const memo = `ton_energy_${energyAmount}_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`

    // Создаем транзакцию
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
          amount: tonPrice,
          currency: 'TON',
          payload: memo,
          sku: `ton_energy_${energyAmount}`,
          itemName: `${energyAmount} энергии (TON)`,
          status: 'PENDING',
          metadata: {
            energyAmount,
            tonPrice,
            memo,
            merchantAddress,
            type: 'energy_purchase',
          },
        },
      })
    })

    const nanoAmount = BigInt(Math.round(tonPrice * 1_000_000_000)).toString()
    const tonUri = `ton://transfer/${merchantAddress}?amount=${nanoAmount}&text=${encodeURIComponent(memo)}`

    return NextResponse.json({
      success: true,
      tonUri,
      memo,
      energyAmount,
      tonPrice,
    })

  } catch (error) {
    console.error('❌ Buy energy with TON error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}