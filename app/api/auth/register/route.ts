// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { registerSchema } from '@/lib/validation/auth'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Register attempt:', body.login)

    const validated = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { login: validated.login }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Пользователь с таким логином уже существует' },
        { status: 409 }
      )
    }

    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(validated.password, saltRounds)

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
      }
    })

    console.log('✅ New user:', user.login)

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
      }
    })

  } catch (error) {
    console.error('❌ Register error:', error)
    
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