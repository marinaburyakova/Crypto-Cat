// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json()

    if (!login || !password) {
      return NextResponse.json(
        { success: false, error: 'Логин и пароль обязательны' },
        { status: 400 }
      )
    }

    // Ищем пользователя
    const user = await prisma.user.findUnique({
      where: { login },
      select: {
        id: true,
        login: true,
        password: true,
        points: true,
        energy: true,
        maxEnergy: true,
        level: true,
        exp: true,
        skin: true,
        vipUntil: true,
        totalSpent: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    // Проверяем пароль
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: 'Аккаунт не настроен. Обратитесь в поддержку' },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    // Убираем пароль из ответа
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('❌ Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}