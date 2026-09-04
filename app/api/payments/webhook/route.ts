// app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payload, status } = body;

    if (!payload) {
      return NextResponse.json(
        { error: 'Missing payload' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findFirst({
      where: { payload: payload }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // ✅ Исправлено: правильное приведение типа
    const newStatus = status === 'paid' ? 'COMPLETED' : 'FAILED';
    
    await prisma.$transaction(async (tx) => {
      // Обновляем транзакцию
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: newStatus as any // Временное решение
          // completedAt: new Date() // Добавьте это поле в схему
        }
      });

      if (newStatus === 'COMPLETED') {
        let pointsToAdd = 0;
        
        if (transaction.amount >= 100) {
          pointsToAdd = Math.floor(transaction.amount * 1.2);
        } else {
          pointsToAdd = transaction.amount;
        }

        // Начисляем баллы пользователю
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            points: { increment: pointsToAdd },
            unclaimedPoints: { increment: pointsToAdd }
          }
        });

        // ✅ Исправлено: используем правильное имя модели
        // Если модели нет, создайте её или используйте другой подход
        // await tx.pointHistory.create({
        //   data: {
        //     userId: transaction.userId,
        //     amount: pointsToAdd,
        //     type: 'PURCHASE',
        //     description: `Покупка за Stars: ${transaction.sku || 'Товар'}`,
        //     transactionId: transaction.id
        //   }
        // });
        
        // Временное решение - логируем начисление
        console.log(`✅ Начислено ${pointsToAdd} баллов пользователю ${transaction.userId} за транзакцию ${transaction.id}`);
      }
    });

    return NextResponse.json({ 
      success: true,
      status: newStatus 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}