// app/api/payments/check-status/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET(req: Request) {
  try {
    // Извлекаем query-параметры из URL запроса
    const { searchParams } = new URL(req.url)
    const memo = searchParams.get('memo')

    if (!memo) {
      return NextResponse.json(
        { error: 'Отсутствует обязательный параметр memo' },
        { status: 400 },
      )
    }

    // Ищем транзакцию в PostgreSQL по уникальному payload-комментарию
    const transaction = await prisma.transaction.findFirst({
      where: {
        payload: memo,
      },
      select: {
        status: true,
        amount: true,
        currency: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { status: 'NOT_FOUND', message: 'Инвойс не найден в системе' },
        { status: 404 },
      )
    }

    // Возвращаем актуальный статус (модалка ждет статус SUCCESS)
    return NextResponse.json({
      success: true,
      status: transaction.status, // PENDING, SUCCESS или FAILED
    })
  } catch (error) {
    console.error('Ошибка при проверке статуса платежа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    )
  }
}
