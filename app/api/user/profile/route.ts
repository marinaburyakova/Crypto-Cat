// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        points: true,
        energy: true,
        maxEnergy: true,
        level: true,
        exp: true,
        unclaimedPoints: true,
        passiveRate: true,
        skin: true,
        vipUntil: true,
        totalSpent: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      ...user,
      // Преобразуем BigInt в number для клиента
      points: Number(user.points),
      unclaimedPoints: Number(user.unclaimedPoints),
      energy: Number(user.energy),
      maxEnergy: Number(user.maxEnergy),
    })

  } catch (error) {
    console.error('❌ Profile API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}