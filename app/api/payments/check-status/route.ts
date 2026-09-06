// app/api/payments/check-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const memo = searchParams.get('memo')
    const userId = searchParams.get('userId')

    if (!memo || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: memo, userId' },
        { status: 400 }
      )
    }

    // 🔥 Ищем транзакцию по payload
    const transaction = await prisma.transaction.findFirst({
      where: {
        payload: memo,
        userId: userId,
      },
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}