// app/api/payments/ton/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { memo, status, transactionHash } = body

    if (!memo || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing memo or transactionHash' },
        { status: 400 }
      )
    }

    // Находим транзакцию
    const transaction = await prisma.transaction.findFirst({
      where: { payload: memo },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.status === 'SUCCESS' || transaction.status === 'COMPLETED') {
      return NextResponse.json(
        { message: 'Already processed' },
        { status: 200 }
      )
    }

    const isSuccess = status === 'success'

    if (isSuccess) {
      // Применяем эффект для TON покупки
      const metadata = transaction.metadata as {
        effect?: string
        effectValue?: any
        energyAmount?: number
        type?: string
      }

      if (metadata.type === 'energy_purchase' && metadata.energyAmount) {
        // Покупка энергии
        const user = await prisma.user.findUnique({
          where: { id: transaction.userId },
        })

        if (user) {
          const currentEnergy = Number(user.energy) || 1000
          const maxEnergy = Number(user.maxEnergy) || 1000
          const newEnergy = Math.min(maxEnergy, currentEnergy + metadata.energyAmount)

          await prisma.user.update({
            where: { id: transaction.userId },
            data: { energy: newEnergy },
          })
        }
      } else if (metadata.effect && transaction.sku) {
        // Покупка товара
        const { applyProductEffect } = await import('@/lib/product-effects')
        await applyProductEffect({
          userId: transaction.userId,
          transactionId: transaction.id,
          productId: transaction.sku,
          effect: metadata.effect,
          effectValue: metadata.effectValue,
        })
      }

      // Обновляем транзакцию
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
          metadata: {
            ...transaction.metadata as any,
            transactionHash,
          },
        },
      })
    } else {
      // Обновляем статус на FAILED
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          metadata: {
            ...transaction.metadata as any,
            error: 'Payment failed',
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
    })

  } catch (error) {
    console.error('❌ TON webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}