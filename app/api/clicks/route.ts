// app/api/clicks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - получение данных пользователя
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing userId parameter',
        },
        { status: 400 },
      )
    }

    // ✅ Ищем пользователя
    let user = await prisma.user.findUnique({
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
      },
    })

    // ✅ Если пользователь не найден - создаем
    if (!user) {
      console.log(`👤 Creating new user: ${userId}`)

      user = await prisma.user.create({
        data: {
          id: userId,
          points: 0,
          energy: 1000,
          maxEnergy: 1000,
          level: 1,
          exp: 0,
          unclaimedPoints: 0,
          passiveRate: 0,
          nonce: 0,
          skin: 'default',
          totalSpent: 0,
        },
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
        },
      })
    }

    // ✅ Преобразуем BigInt в number для клиента
    return NextResponse.json({
      success: true,
      points: Number(user.points),
      energy: Number(user.energy),
      maxEnergy: Number(user.maxEnergy),
      level: user.level,
      exp: user.exp,
      unclaimedPoints: Number(user.unclaimedPoints),
      passiveRate: user.passiveRate,
      skin: user.skin,
      vipUntil: user.vipUntil,
      totalSpent: user.totalSpent,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  } catch (error) {
    console.error('❌ GET /api/clicks error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 },
    )
  }
}

// POST - обновление кликов
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, clicks } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 },
      )
    }

    if (typeof clicks !== 'number' || clicks <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid clicks count' },
        { status: 400 },
      )
    }

    // ✅ Находим или создаем пользователя
    let user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          points: 0,
          energy: 1000,
          maxEnergy: 1000,
          level: 1,
          exp: 0,
          unclaimedPoints: 0,
          passiveRate: 0,
          nonce: 0,
          skin: 'default',
          totalSpent: 0,
        },
      })
    }

    // ✅ Обновляем данные
    const pointsToAdd = clicks * 10
    const newPoints = Number(user.points) + pointsToAdd
    const newEnergy = Math.max(0, Number(user.energy) - clicks)
    const newLevel = Math.floor(newPoints / 500) + 1
    const newExp = newPoints % 500

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        points: newPoints,
        energy: newEnergy,
        level: newLevel,
        exp: newExp,
        updatedAt: new Date(),
      },
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
      },
    })

    return NextResponse.json({
      success: true,
      points: Number(updatedUser.points),
      energy: Number(updatedUser.energy),
      maxEnergy: Number(updatedUser.maxEnergy),
      level: updatedUser.level,
      exp: updatedUser.exp,
      unclaimedPoints: Number(updatedUser.unclaimedPoints),
      passiveRate: updatedUser.passiveRate,
    })
  } catch (error) {
    console.error('❌ POST /api/clicks error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 },
    )
  }
}
