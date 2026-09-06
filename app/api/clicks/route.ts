// app/api/clicks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      )
    }

    console.log('📊 GET /api/clicks for user:', userId)

    // ✅ Автоматически создаём пользователя, если его нет
    const user = await prisma.user.upsert({
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

    console.log('✅ User data:', {
      id: user.id,
      points: Number(user.points),
      energy: user.energy,
      level: user.level,
    })

    return NextResponse.json({
      points: Number(user.points),
      energy: user.energy,
      maxEnergy: user.maxEnergy,
      level: user.level,
      exp: user.exp,
      passiveRate: user.passiveRate,
      unclaimedPoints: Number(user.unclaimedPoints) || 0,
      skin: user.skin,
      vipUntil: user.vipUntil,
      totalSpent: Number(user.totalSpent) || 0,
    })
  } catch (error) {
    console.error('❌ Error in /api/clicks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}