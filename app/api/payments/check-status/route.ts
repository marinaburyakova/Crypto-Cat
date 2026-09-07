import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const memo = searchParams.get('memo')
    const orderId = searchParams.get('orderId')
    const userId = searchParams.get('userId')

    // ✅ Валидация обязательных полей
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid userId' },
        { status: 400 }
      )
    }

    // ✅ Проверка: должен быть либо memo, либо orderId
    if (!memo && !orderId) {
      return NextResponse.json(
        { error: 'Missing selection field: provide either memo or orderId' },
        { status: 400 }
      )
    }

    // 🔥 Составляем гибкое условие поиска
    const whereCondition: Prisma.TransactionWhereInput = {
      userId: userId,
      ...(orderId ? { id: orderId } : {}),
      ...(memo ? { payload: memo } : {}),
    }

    // ✅ Проверяем подключение к БД
    await prisma.$connect()

    // Ищем транзакцию в базе данных Prisma
    const transaction = await prisma.transaction.findFirst({
      where: whereCondition,
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      status: transaction.status,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      },
    })
  } catch (error) {
    console.error('❌ Check status error:', error)

    // ✅ Обработка специфических ошибок Prisma
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Ошибки Prisma (например, таймаут, deadlock и т.д.)
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    // ✅ Всегда закрываем соединение
    await prisma.$disconnect()
  }
}