// app/api/payments/ton-invoice/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { userId, itemPriceTon, itemSku } = await req.json()

    if (!userId || !itemPriceTon || !itemSku) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 },
      )
    }

    const uniqueMemo = `cat_${itemSku}_${crypto.randomBytes(4).toString('hex')}`

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ P2003:
    // Гарантируем, что запись пользователя существует в родительской таблице User
    await prisma.user.upsert({
      where: { id: userId },
      update: {}, // Если существует, ничего не меняем
      create: {
        // Если отсутствует, создаем дефолтный профиль
        id: userId,
        points: 0,
        unclaimedPoints: 0,
        level: 1,
        passiveRate: 0,
      },
    })

    // Теперь создание транзакции пройдет со 100% успехом
    await prisma.transaction.create({
      data: {
        userId,
        amount: parseFloat(itemPriceTon),
        currency: 'TON',
        payload: uniqueMemo,
        status: 'PENDING',
      },
    })

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      return NextResponse.json(
        { error: 'Адрес мерчанта не настроен' },
        { status: 500 },
      )
    }

    const nanoAmount = BigInt(
      Math.round(parseFloat(itemPriceTon) * 1_000_000_000),
    ).toString()
    const tonUri = `ton://transfer/${merchantAddress}?amount=${nanoAmount}&text=${encodeURIComponent(uniqueMemo)}`

    return NextResponse.json({
      success: true,
      tonUri,
      memo: uniqueMemo,
    })
  } catch (error) {
    console.error('Ошибка генерации TON инвойса:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    )
  }
}
