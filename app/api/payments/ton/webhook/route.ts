// app/api/payments/stars/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyProductEffect } from '@/lib/product-effects'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { payload, status } = body

    if (!payload) {
      return NextResponse.json(
        { error: 'Missing payload' },
        { status: 400 }
      )
    }

    const transaction = await prisma.transaction.findUnique({
      where: { payload },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // ✅ Проверяем, что транзакция уже обработана
    if (transaction.status === 'SUCCESS' || transaction.status === 'COMPLETED') {
      return NextResponse.json(
        { message: 'Already processed' },
        { status: 200 }
      )
    }

    const isSuccess = status === 'paid'

    // ✅ Если платеж успешен - применяем эффект
    if (isSuccess && transaction.metadata && transaction.sku) {
      const metadata = transaction.metadata as {
        effect: string
        effectValue: any
      }
      
      await applyProductEffect({
        userId: transaction.userId,
        transactionId: transaction.id,
        productId: transaction.sku,
        effect: metadata.effect,
        effectValue: metadata.effectValue,
      })

      return NextResponse.json({
        success: true,
        status: 'SUCCESS',
      })
    }

    // ✅ Если платеж не удался
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: false,
      status: 'FAILED',
    })

  } catch (error) {
    console.error('❌ Stars webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}