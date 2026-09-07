import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const memo = searchParams.get('memo')
    const orderId = searchParams.get('orderId') // 👈 Добавляем поддержку orderId
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    if (!memo && !orderId) {
      return NextResponse.json(
        { error: 'Missing selection field: provide either memo or orderId' },
        { status: 400 }
      )
    }

    // 🔥 Составляем гибкое условие поиска
    const whereCondition: any = { userId: userId }
    if (orderId) {
      whereCondition.id = orderId // Ищем по первичному ключу ID транзакции
    } else if (memo) {
      whereCondition.payload = memo // Или по текстовому payload
    }

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
      status: transaction.status, // Вернет PENDING, SUCCESS, FAILED и т.д.
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
