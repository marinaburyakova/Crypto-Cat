// app/api/payments/energy/buy-stars/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ENERGY_PRICES = {
  100: 50,
  500: 200,
  1000: 350,
  5000: 1500,
} as const

type EnergyAmount = keyof typeof ENERGY_PRICES

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount } = body

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount' },
        { status: 400 },
      )
    }

    const energyAmount = Number(amount)
    if (!ENERGY_PRICES[energyAmount as EnergyAmount]) {
      return NextResponse.json(
        { error: 'Invalid energy amount' },
        { status: 400 },
      )
    }

    const starsCost = ENERGY_PRICES[energyAmount as EnergyAmount]

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userStars = Number(user.points) || 0
    if (userStars < starsCost) {
      return NextResponse.json(
        {
          error: 'Not enough Stars',
          required: starsCost,
          balance: userStars,
        },
        { status: 400 },
      )
    }

    const currentEnergy = Number(user.energy) || 1000
    const maxEnergy = Number(user.maxEnergy) || 1000

    if (currentEnergy >= maxEnergy) {
      return NextResponse.json(
        {
          error: 'Energy is full',
          current: currentEnergy,
          max: maxEnergy,
        },
        { status: 400 },
      )
    }

    const newEnergy = Math.min(maxEnergy, currentEnergy + energyAmount)
    const energyAdded = newEnergy - currentEnergy

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          points: { decrement: starsCost },
          energy: newEnergy,
        },
      })

      await tx.transaction.create({
        data: {
          userId,
          amount: starsCost,
          currency: 'STARS',
          payload: `energy_${energyAmount}_${Date.now()}`,
          sku: `energy_${energyAmount}`,
          itemName: `${energyAmount} энергии`,
          status: 'SUCCESS',
          metadata: {
            energyAdded,
            energyBefore: currentEnergy,
            energyAfter: newEnergy,
            starsCost,
          },
        },
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      starsRemaining: Number(updatedUser.points),
      energy: Number(updatedUser.energy),
      energyAdded,
      maxEnergy: Number(updatedUser.maxEnergy),
    })
  } catch (error) {
    console.error('❌ Stars energy purchase error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
