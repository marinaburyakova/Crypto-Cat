import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
    }

    const now = new Date()

    // 1. Сначала просто получаем пользователя, чтобы узнать его updatedAt и passiveRate
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    let earnedPoints = BigInt(0)

    // 2. Если пользователь уже существует и у него есть пассивный доход, считаем его оффлайн начисления
    if (existingUser && existingUser.passiveRate > 0) {
      const lastUpdate = new Date(existingUser.updatedAt)
      const secondsOffline = Math.max(0, Math.floor((now.getTime() - lastUpdate.getTime()) / 1000))
      
      if (secondsOffline > 0) {
        earnedPoints = BigInt(secondsOffline * existingUser.passiveRate)
      }
    }

    // 3. 🔥 Используем ИДЕМПОТЕНТНЫЙ upsert. Он никогда не вызовет ошибку P2002 при параллельных запросах!
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: earnedPoints > 0 ? {
        unclaimedPoints: {
          increment: earnedPoints // Безопасно инкрементируем BigInt в БД
        }
      } : {}, // Если очков нет, ничего не обновляем
      create: {
        id: userId,
        login: userId,
        points: 0,
        unclaimedPoints: 0,
        energy: 1000,
        maxEnergy: 1000,
        level: 1,
        exp: 0,
        passiveRate: 0,
        skin: 'default',
      },
    })

    // 4. ✅ Безопасно сериализуем BigInt в string
    return NextResponse.json({
      points: user.points.toString(),
      energy: user.energy,
      maxEnergy: user.maxEnergy,
      level: user.level,
      exp: user.exp,
      passiveRate: user.passiveRate,
      unclaimedPoints: user.unclaimedPoints.toString(),
      skin: user.skin,
      vipUntil: user.vipUntil,
      totalSpent: Number(user.totalSpent) || 0,
    })
  } catch (error) {
    console.error('❌ Error in /api/clicks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
