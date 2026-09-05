// app/api/clicks/route.ts
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

    // 🔥 Если это гость — НЕ создаём в БД, возвращаем нулевые данные
    if (userId === 'guest') {
      return NextResponse.json({
        success: true,
        points: 0,
        energy: 1000,
        maxEnergy: 1000,
        level: 1,
        exp: 0,
        unclaimedPoints: 0,
        passiveRate: 0,
        skin: 'default',
        vipUntil: null,
        totalSpent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    // 🔥 Только для авторизованных пользователей — работаем с БД
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
      }
    })

    // Если пользователь не найден — создаём (только для авторизованных)
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
          skin: 'default',
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
        }
      })
    }

    return NextResponse.json({
      success: true,
      ...user,
      points: Number(user.points),
      unclaimedPoints: Number(user.unclaimedPoints),
    })

  } catch (error) {
    console.error('❌ GET /api/clicks error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, clicks } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      )
    }

    // 🔥 Если гость — не сохраняем в БД, просто возвращаем успех
    if (userId === 'guest') {
      return NextResponse.json({
        success: true,
        points: 0,
        energy: 1000,
        maxEnergy: 1000,
      })
    }

    // Для авторизованных — обновляем в БД
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        points: { increment: clicks * 10 },
        energy: { decrement: clicks },
      },
      select: {
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
    console.error('❌ POST /api/clicks error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}