// app/api/payments/buy-stars/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, itemName, itemSku, price, data } = body

    console.log('📦 Buy Stars request:', { userId, type, itemName, price })

    // ✅ Проверка обязательных полей
    if (!userId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type' },
        { status: 400 }
      )
    }

    // 🔥 ЗАПРЕЩАЕМ демо-режим для Stars
    if (userId === 'demo') {
      return NextResponse.json(
        { error: 'Демо-режим: покупка за Stars недоступна. Пожалуйста, войдите в аккаунт.' },
        { status: 403 }
      )
    }

    // ✅ Проверяем, что пользователь существует в БД
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Пожалуйста, зарегистрируйтесь.' },
        { status: 404 }
      )
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    
    // 🔥 Формируем payload в зависимости от типа
    let payload = `stars_${type}_${userId}_${Date.now()}`
    let description = itemName || 'Покупка в магазине'
    
    if (type === 'energy') {
      payload = `stars_energy_${data.amount}_${userId}_${Date.now()}`
      description = `${data.amount} энергии`
    } else if (type === 'boost') {
      payload = `stars_boost_${data.effect}_${data.value}_${userId}_${Date.now()}`
      description = `Буст: ${data.effect} +${data.value}`
    } else if (type === 'level') {
      payload = `stars_level_${data.value}_${userId}_${Date.now()}`
      description = `Повышение уровня +${data.value}`
    } else if (type === 'vip') {
      payload = `stars_vip_${data.value}_${userId}_${Date.now()}`
      description = `VIP на ${data.value} дней`
    }

    // 🔥 Создаём инвойс в Telegram за Stars
    const invoiceResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: itemName || 'Покупка за Stars',
          description: description,
          payload: payload,
          currency: 'XTR',
          prices: [{ label: itemName || 'Товар', amount: price * 100 }],
        }),
      }
    )

    const invoiceData = await invoiceResponse.json()

    if (!invoiceData.ok) {
      console.error('❌ Telegram Stars invoice error:', invoiceData)
      return NextResponse.json(
        { error: 'Failed to create Stars invoice' },
        { status: 500 }
      )
    }

    // 🔥 Сохраняем транзакцию
    await prisma.transaction.create({
      data: {
        userId,
        amount: price,
        currency: 'STARS',
        status: 'PENDING',
        payload: payload,
        sku: itemSku,
        itemName: itemName,
        metadata: {
          type,
          data,
        },
      },
    })

    console.log('✅ Stars invoice created for user:', userId)

    return NextResponse.json({
      success: true,
      invoiceLink: invoiceData.result,
      payload: payload,
    })
  } catch (error) {
    console.error('❌ Buy Stars error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}