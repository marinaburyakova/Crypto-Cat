// app/api/payments/stars/create-invoice/route.ts
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

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        login: userId, // ← добавляем login
        points: 0,
        energy: 1000,
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

    // ... остальная логика создания инвойса

    return NextResponse.json({
      success: true,
      invoice: {
        // ... данные инвойса
      }
    })

  } catch (error) {
    console.error('❌ Create stars invoice error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}