// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json()

    // Валидация
    if (!login || !password) {
      return NextResponse.json(
        { success: false, error: 'Логин и пароль обязательны' },
        { status: 400 }
      )
    }

    if (login.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Логин должен быть минимум 3 символа' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Пароль должен быть минимум 6 символов' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { login }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Пользователь с таким логином уже существует' },
        { status: 409 }
      )
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10)

    // Создаём пользователя
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        login,
        password: hashedPassword,
        points: 0,
        energy: 1000,
        maxEnergy: 1000,
        level: 1,
        exp: 0,
        skin: 'default',
      },
      select: {
        id: true,
        login: true,
        points: true,
        energy: true,
        maxEnergy: true,
        level: true,
        exp: true,
        skin: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Регистрация успешна',
      user
    })

  } catch (error) {
    console.error('❌ Register error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}