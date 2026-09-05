// app/api/payments/energy/buy-ton/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      )
    }

    // Найти или создать пользователя
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        points: { increment: amount },
        energy: { increment: amount },
      },
      create: {
        id: userId,
        login: userId, // ← добавляем login
        points: amount,
        energy: 1000 + amount,
        maxEnergy: 1000,
        level: 1,
        exp: 0,
        unclaimedPoints: 0,
        passiveRate: 0,
        skin: 'default',
      },
      select: {
        id: true,
        points: true,
        energy: true,
        maxEnergy: true,
      }
    })

    return NextResponse.json({
      success: true,
      points: Number(user.points),
      energy: user.energy,
      maxEnergy: user.maxEnergy,
    })

  } catch (error) {
    console.error('❌ Buy TON energy error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}