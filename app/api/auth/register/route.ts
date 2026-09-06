// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// 🔥 Упрощаем схему для регистрации (без confirmPassword)
const registerSchema = z.object({
  login: z
    .string()
    .min(3, 'Логин должен быть минимум 3 символа')
    .max(20, 'Логин не может быть длиннее 20 символов')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Логин может содержать только буквы, цифры и подчёркивание',
    )
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Пароль должен быть минимум 8 символов')
    .max(100, 'Пароль слишком длинный')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
    .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру')
    .regex(/[^A-Za-z0-9]/, 'Пароль должен содержать хотя бы один спецсимвол'),
})

export async function POST(request: NextRequest) {
  try {
    console.log('📝 [SERVER] Регистрация начата')

    // 1️⃣ Получаем тело запроса
    const body = await request.json()
    console.log('📝 [SERVER] Получен body:', body)

    // 2️⃣ Валидация
    const validated = registerSchema.parse(body)
    console.log('✅ [SERVER] Валидация пройдена для:', validated.login)

    // 3️⃣ Проверка существующего пользователя
    const existingUser = await prisma.user.findUnique({
      where: { login: validated.login },
    })

    if (existingUser) {
      console.log('⚠️ [SERVER] Пользователь уже существует:', validated.login)
      return NextResponse.json(
        {
          success: false,
          error: 'Пользователь с таким логином уже существует',
        },
        { status: 409 },
      )
    }

    // 4️⃣ Хеширование пароля
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(validated.password, saltRounds)
    console.log('✅ [SERVER] Пароль захэширован')

    // 5️⃣ Создание пользователя
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        login: validated.login,
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
      },
    })

    console.log('✅ [SERVER] Пользователь создан:', user.login)

    return NextResponse.json({
      success: true,
      message: 'Регистрация успешна',
      user: {
        id: user.id,
        login: user.login,
        points: Number(user.points),
        energy: user.energy,
        maxEnergy: user.maxEnergy,
        level: user.level,
        exp: user.exp,
        skin: user.skin,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('❌ [SERVER] Ошибка регистрации:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues.map((e) => e.message) },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    )
  }
}
