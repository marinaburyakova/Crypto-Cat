// app/api/payments/ton-invoice/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'  // ✅ Исправлен импорт
import crypto from 'crypto'

// Константы для валидации
const MIN_TON_AMOUNT = 0.01;  // Минимальная сумма в TON
const MAX_TON_AMOUNT = 1000;  // Максимальная сумма в TON
const MAX_SKU_LENGTH = 255;

export async function POST(req: Request) {
  try {
    const { userId, itemPriceTon, itemSku, itemName } = await req.json()

    // 1. Валидация обязательных полей
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Некорректный или отсутствующий userId' },
        { status: 400 },
      )
    }

    if (!itemSku || typeof itemSku !== 'string' || itemSku.length > MAX_SKU_LENGTH) {
      return NextResponse.json(
        { error: 'Некорректный SKU товара' },
        { status: 400 },
      )
    }

    if (!itemPriceTon) {
      return NextResponse.json(
        { error: 'Отсутствует цена товара' },
        { status: 400 },
      )
    }

    // 2. Валидация цены
    const price = parseFloat(itemPriceTon);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: 'Некорректная цена товара' },
        { status: 400 },
      )
    }

    // 3. Проверка лимитов TON
    if (price < MIN_TON_AMOUNT) {
      return NextResponse.json(
        { error: `Минимальная сумма: ${MIN_TON_AMOUNT} TON` },
        { status: 400 },
      )
    }

    if (price > MAX_TON_AMOUNT) {
      return NextResponse.json(
        { error: `Максимальная сумма: ${MAX_TON_AMOUNT} TON` },
        { status: 400 },
      )
    }

    // 4. Проверка адреса мерчанта
    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      console.error('MERCHANT_WALLET_ADDRESS не настроен в .env')
      return NextResponse.json(
        { error: 'Адрес мерчанта не настроен' },
        { status: 500 },
      )
    }

    // 5. Валидация адреса мерчанта (базовая проверка)
    if (!merchantAddress.match(/^[A-Za-z0-9_-]{48}$/)) {
      console.error('Некорректный адрес мерчанта:', merchantAddress)
      return NextResponse.json(
        { error: 'Некорректный адрес мерчанта' },
        { status: 500 },
      )
    }

    // 6. Генерация уникального memo
    const uniqueMemo = `cat_${itemSku}_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`

    // 7. Создание транзакции в БД (все в одной транзакции)
    const transaction = await prisma.$transaction(async (tx) => {
      // Гарантируем наличие пользователя
      await tx.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          points: 0,
          unclaimedPoints: 0,
          level: 1,
          passiveRate: 0,
          energy: 1000,
          maxEnergy: 1000,
        },
      })

      // Создаем транзакцию с полными данными
      const newTransaction = await tx.transaction.create({
        data: {
          userId,
          amount: price,
          currency: 'TON',
          payload: uniqueMemo,
          sku: itemSku,          // ✅ Добавлен SKU
          itemName: itemName || `Товар ${itemSku}`,  // ✅ Добавлено название
          status: 'PENDING',
          metadata: {
            priceTon: price,
            memo: uniqueMemo,
            merchantAddress: merchantAddress,
            createdAt: new Date().toISOString()
          }
        },
      })

      return newTransaction
    })

    // 8. Расчет суммы в нано-тона
    // Важно: TON имеет 9 знаков после запятой (1 TON = 1_000_000_000 нано-тон)
    const nanoAmount = BigInt(
      Math.round(price * 1_000_000_000)
    ).toString()

    // 9. Формирование TON URI
    const tonUri = `ton://transfer/${merchantAddress}?amount=${nanoAmount}&text=${encodeURIComponent(uniqueMemo)}`

    // 10. Логирование для отладки
    console.log(`✅ Создан TON инвойс:`, {
      userId,
      amount: price,
      sku: itemSku,
      memo: uniqueMemo,
      transactionId: transaction.id
    })

    // 11. Возврат успешного ответа
    return NextResponse.json({
      success: true,
      tonUri,
      memo: uniqueMemo,
      transactionId: transaction.id,
      amount: price,
      currency: 'TON',
      merchantAddress: merchantAddress,
    })

  } catch (error) {
    console.error('❌ Ошибка генерации TON инвойса:', error)
    
    // Детальное логирование ошибки
    if (error instanceof Error) {
      console.error('Детали ошибки:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }

    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 },
    )
  }
}