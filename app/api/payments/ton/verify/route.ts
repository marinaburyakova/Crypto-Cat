// app/api/payments/ton/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const memo = searchParams.get('memo')
    const userId = searchParams.get('userId')

    if (!memo || !userId) {
      return NextResponse.json(
        { error: 'Missing memo or userId' },
        { status: 400 }
      )
    }

    // Находим транзакцию
    const transaction = await prisma.transaction.findFirst({
      where: {
        payload: memo,
        userId,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Проверяем статус
    const isCompleted = transaction.status === 'SUCCESS' || transaction.status === 'COMPLETED'

    return NextResponse.json({
      success: true,
      status: transaction.status,
      isCompleted,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      },
    })

  } catch (error) {
    console.error('❌ TON verify error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}