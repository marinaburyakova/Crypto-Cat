// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

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

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ [SERVER] Ошибка парсинга JSON:', parseError)
      return NextResponse.json(
        { success: false, error: 'Неверный формат запроса' },
        { status: 400 },
      )
    }

    console.log('📝 [SERVER] Получен body:', JSON.stringify(body))

    let validated
    try {
      validated = registerSchema.parse(body)
    } catch (validationError) {
      console.error('❌ [SERVER] Ошибка валидации:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            errors: validationError.issues.map((e) => e.message),
          },
          { status: 400 },
        )
      }
      throw validationError
    }

    console.log('✅ [SERVER] Валидация пройдена для:', validated.login)

    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { login: validated.login },
      })
    } catch (dbError) {
      console.error('❌ [SERVER] Ошибка запроса к БД:', dbError)
      return NextResponse.json(
        { success: false, error: 'Ошибка базы данных' },
        { status: 500 },
      )
    }

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

    let hashedPassword
    try {
      const saltRounds = 12
      hashedPassword = await bcrypt.hash(validated.password, saltRounds)
      console.log('✅ [SERVER] Пароль захэширован')
    } catch (hashError) {
      console.error('❌ [SERVER] Ошибка хеширования:', hashError)
      return NextResponse.json(
        { success: false, error: 'Ошибка шифрования' },
        { status: 500 },
      )
    }

    let user
    try {
      user = await prisma.user.create({
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
          passiveRate: 0, // ✅ ДОБАВЛЕНО
          unclaimedPoints: 0, // ✅ ДОБАВЛЕНО
          totalSpent: 0, // ✅ ДОБАВЛЕНО
          createdAt: new Date(), // ✅ ДОБАВЛЕНО
          updatedAt: new Date(), // ✅ ДОБАВЛЕНО
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
    } catch (createError) {
      console.error('❌ [SERVER] Ошибка создания пользователя:', createError)
      return NextResponse.json(
        { success: false, error: 'Ошибка создания пользователя' },
        { status: 500 },
      )
    }

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
    console.error('❌ [SERVER] Неизвестная ошибка:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    )
  }
}
