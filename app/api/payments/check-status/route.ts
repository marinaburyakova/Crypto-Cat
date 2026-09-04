// app/api/payments/check-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const memo = searchParams.get('memo')
    const userId = searchParams.get('userId')

    if (!memo || !userId) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные параметры: memo, userId' },
        { status: 400 },
      )
    }

    // Найти транзакцию по payload (memo)
    const transaction = await prisma.transaction.findFirst({
      where: {
        payload: memo,
        userId: userId,
      },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        payload: true,
        createdAt: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, status: 'NOT_FOUND', message: 'Инвойс не найден' },
        { status: 404 },
      )
    }

    // Если транзакция успешна - применяем игровую логику
    if (transaction.status === 'SUCCESS') {
      const sku = transaction.payload.split('_')[0] || 'unknown'
      await applyItemEffect(userId, sku, transaction.amount)
    }

    return NextResponse.json({
      success: true,
      status: transaction.status,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        createdAt: transaction.createdAt,
      },
    })
  } catch (error) {
    console.error('❌ Ошибка проверки статуса платежа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    )
  }
}

// Функция применения эффекта товара
async function applyItemEffect(userId: string, sku: string, amount: number) {
  try {
    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      console.error('❌ Пользователь не найден:', userId)
      return
    }

    // ✅ Преобразуем BigInt в number
    const currentPoints = Number(user.points) || 0
    const currentEnergy = Number(user.energy) || 0
    const currentMaxEnergy = Number(user.maxEnergy) || 0
    const currentLevel = Number(user.level) || 1
    const currentPassiveRate = Number(user.passiveRate) || 0

    let updateData: any = {
      updatedAt: new Date(),
    }

    // Применяем эффект в зависимости от SKU
    switch (sku) {
      case 'energy_boost':
        // +50 к максимальной энергии
        updateData.maxEnergy = currentMaxEnergy + 50
        updateData.energy = currentEnergy + 50
        break

      case 'level_up':
        // +1 уровень + 50 очков
        updateData.level = currentLevel + 1
        updateData.points = currentPoints + 50
        break

      case 'vip_status':
        // +100% к пассивному доходу на 7 дней
        updateData.passiveRate = currentPassiveRate * 2
        // В реальном проекте нужно сохранять время окончания VIP
        // updateData.vipUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        break

      case 'legendary_skin':
        // Легендарный скин + 100 очков
        updateData.points = currentPoints + 100
        // В реальном проекте нужно сохранить информацию о скине
        // updateData.skin = 'legendary'
        break

      case 'mega_pack':
        // Всё сразу
        updateData.maxEnergy = currentMaxEnergy + 100
        updateData.energy = currentEnergy + 100
        updateData.level = currentLevel + 2
        updateData.points = currentPoints + 500
        updateData.passiveRate = currentPassiveRate * 2
        break

      default:
        console.warn('⚠️ Неизвестный SKU:', sku)
        return
    }

    // Обновляем пользователя
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    console.log(`✅ Применен эффект для товара ${sku} пользователю ${userId}`)
    console.log(`📊 Обновленные данные:`, updateData)
  } catch (error) {
    console.error('❌ Ошибка применения эффекта товара:', error)
  }
}
