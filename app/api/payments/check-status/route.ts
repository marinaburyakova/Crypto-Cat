// app/api/payments/check-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Типы для эффектов товаров
interface ItemEffect {
  points?: number;
  energy?: number;
  maxEnergy?: number;
  level?: number;
  passiveRate?: number;
  vipUntil?: Date;
  skin?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const memo = searchParams.get('memo')
    const userId = searchParams.get('userId')

    // 1. Валидация параметров
    if (!memo || !userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Отсутствуют обязательные параметры: memo, userId' 
        },
        { status: 400 },
      )
    }

    // 2. Поиск транзакции
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
        sku: true,
        itemName: true,
        createdAt: true,
        completedAt: true,
        metadata: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { 
          success: false, 
          status: 'NOT_FOUND', 
          message: 'Инвойс не найден' 
        },
        { status: 404 },
      )
    }

    // ✅ Исправлено: приведение типа
    const status = transaction.status as string;
    
    // 3. Обработка различных статусов
    if (status === 'FAILED' || status === 'REFUNDED') {
      return NextResponse.json({
        success: false,
        status: transaction.status,
        message: status === 'FAILED' 
          ? 'Платеж не удался' 
          : 'Платеж возвращен',
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          createdAt: transaction.createdAt,
        },
      })
    }

    // 4. Применение эффекта только для SUCCESS и если не применен
    if (status === 'SUCCESS') {
      // Проверяем, не применен ли уже эффект
      const isApplied = transaction.metadata && 
        typeof transaction.metadata === 'object' && 
        'applied' in transaction.metadata && 
        transaction.metadata.applied === true

      if (!isApplied) {
        // Извлекаем SKU из транзакции или из payload
        const sku = transaction.sku || extractSkuFromPayload(transaction.payload)
        
        if (sku && sku !== 'unknown') {
          await applyItemEffect(userId, sku, transaction.amount, transaction.id)
        } else {
          console.warn('⚠️ Неизвестный SKU для транзакции:', transaction.id)
        }
      } else {
        console.log(`ℹ️ Эффект уже применен для транзакции ${transaction.id}`)
      }
    }

    // 5. Возврат успешного ответа
    return NextResponse.json({
      success: true,
      status: transaction.status,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
        sku: transaction.sku,
        itemName: transaction.itemName,
      },
    })

  } catch (error) {
    console.error('❌ Ошибка проверки статуса платежа:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Внутренняя ошибка сервера' 
      },
      { status: 500 },
    )
  }
}

// Вспомогательная функция для извлечения SKU из payload
function extractSkuFromPayload(payload: string): string {
  try {
    const parts = payload.split('_')
    if (parts.length >= 2) {
      if (parts[0] === 'stars' || parts[0] === 'cat' || parts[0] === 'ton') {
        return parts[1] || 'unknown'
      }
      return parts[0] || 'unknown'
    }
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

// Функция применения эффекта товара
async function applyItemEffect(
  userId: string, 
  sku: string, 
  amount: number,
  transactionId: string
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      console.error('❌ Пользователь не найден:', userId)
      return
    }

    // Преобразуем BigInt в number
    const currentPoints = Number(user.points) || 0
    const currentEnergy = Number(user.energy) || 1000
    const currentMaxEnergy = Number(user.maxEnergy) || 1000
    const currentLevel = Number(user.level) || 1
    const currentPassiveRate = Number(user.passiveRate) || 0

    // Используем транзакцию для атомарности
    await prisma.$transaction(async (tx) => {
      let updateData: Partial<ItemEffect> = {}
      let effectDescription = ''

      switch (sku) {
        case 'energy_boost':
          updateData = {
            maxEnergy: currentMaxEnergy + 50,
            energy: Math.min(currentEnergy + 50, currentMaxEnergy + 50),
          }
          effectDescription = '+50 к максимальной энергии'
          break

        case 'energy_boost_big':
          updateData = {
            maxEnergy: currentMaxEnergy + 200,
            energy: Math.min(currentEnergy + 200, currentMaxEnergy + 200),
          }
          effectDescription = '+200 к максимальной энергии'
          break

        case 'level_up':
          updateData = {
            level: currentLevel + 1,
            points: currentPoints + 50,
          }
          effectDescription = '+1 уровень и 50 очков'
          break

        case 'level_up_big':
          updateData = {
            level: currentLevel + 3,
            points: currentPoints + 200,
          }
          effectDescription = '+3 уровня и 200 очков'
          break

        case 'vip_status':
          updateData = {
            passiveRate: currentPassiveRate * 2,
            vipUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          }
          effectDescription = 'VIP статус на 7 дней (+100% пассивный доход)'
          break

        case 'legendary_skin':
          updateData = {
            points: currentPoints + 100,
            skin: 'legendary',
          }
          effectDescription = 'Легендарный скин + 100 очков'
          break

        case 'mega_pack':
          updateData = {
            maxEnergy: currentMaxEnergy + 100,
            energy: Math.min(currentEnergy + 100, currentMaxEnergy + 100),
            level: currentLevel + 2,
            points: currentPoints + 500,
            passiveRate: currentPassiveRate * 2,
            vipUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          }
          effectDescription = 'Мега-пак: +100 энергии, +2 уровня, +500 очков, VIP на 3 дня'
          break

        default:
          console.warn('⚠️ Неизвестный SKU:', sku)
          return
      }

      // Обновляем пользователя
      await tx.user.update({
        where: { id: userId },
        data: updateData,
      })

      // Обновляем транзакцию
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          completedAt: new Date(),
          metadata: {
            applied: true,
            effectDescription,
            sku,
            appliedAt: new Date().toISOString()
          }
        },
      })

      // ✅ Исправлено: проверяем существование модели pointHistory
      // Если модели нет, создаем запись в лог или пропускаем
      try {
        // Проверяем, существует ли модель pointHistory
        if (tx.pointHistory) {
          if (updateData.points && updateData.points > currentPoints) {
            const pointsEarned = (updateData.points as number) - currentPoints
            await tx.pointHistory.create({
              data: {
                userId,
                amount: pointsEarned,
                type: 'PURCHASE',
                description: `Начисление за покупку: ${sku} (${effectDescription})`,
                transactionId,
              },
            })
          }
        } else {
          // Если модели нет, просто логируем
          console.log(`📊 Начислено очков за покупку ${sku}:`, updateData.points)
        }
      } catch (pointHistoryError) {
        // Если ошибка связана с отсутствием модели, игнорируем
        console.warn('⚠️ PointHistory model not available, skipping history record')
      }

      console.log(`✅ Применен эффект для товара ${sku} пользователю ${userId}`)
      console.log(`📊 Эффект: ${effectDescription}`)
    })

  } catch (error) {
    console.error('❌ Ошибка применения эффекта товара:', error)
  }
}