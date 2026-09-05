// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { loginSchema } from '@/lib/validation/auth'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Получаем данные
    const body = await request.json()
    console.log('🔐 Login attempt:', body.login)

    // 2️⃣ Валидация
    const validated = loginSchema.parse(body)

    // 3️⃣ Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { login: validated.login },
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
      console.log('❌ User not found:', validated.login)
      return NextResponse.json(
        { success: false, error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    if (!user.password) {
      console.log('❌ User has no password:', validated.login)
      return NextResponse.json(
        { success: false, error: 'Аккаунт не настроен' },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(validated.password, user.password)
    console.log('🔑 Password valid:', isValid)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    const { password: _, ...userWithoutPassword } = user

    console.log('✅ Login success:', validated.login)

    return NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        points: Number(userWithoutPassword.points),
      }
    })

  } catch (error) {
    console.error('❌ Login error:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues.map(e => e.message) },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}