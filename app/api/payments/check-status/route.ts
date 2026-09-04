// app/api/payments/check-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const payload = searchParams.get('payload')
    const userId = searchParams.get('userId')

    if (!payload || !userId) {
      return NextResponse.json(
        { error: 'Missing payload or userId' },
        { status: 400 }
      )
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        payload,
        userId,
      },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        payload: true,
        sku: true,
        itemName: true,
        applied: true,
        createdAt: true,
        completedAt: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // ✅ Проверяем статус с учетом applied
    let status = transaction.status
    if (transaction.applied && status !== 'SUCCESS' && status !== 'COMPLETED') {
      status = 'COMPLETED'
    }

    return NextResponse.json({
      success: true,
      status,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        applied: transaction.applied,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      },
    })

  } catch (error) {
    console.error('❌ Status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}