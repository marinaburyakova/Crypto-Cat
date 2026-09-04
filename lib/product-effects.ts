// lib/product-effects.ts
import { prisma } from '@/lib/prisma'

interface ApplyEffectParams {
  userId: string
  transactionId: string
  productId: string
  effect: string
  effectValue: any
}

export async function applyProductEffect({
  userId,
  transactionId,
  productId,
  effect,
  effectValue,
}: ApplyEffectParams) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // ✅ Получаем транзакцию и проверяем
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  })

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  // ✅ Проверяем, что транзакция уже не применена
  if (transaction.applied) {
    console.log(`⚠️ Transaction ${transactionId} already applied`)
    return { success: true, alreadyApplied: true }
  }

  const updateData: any = {}
  let description = ''
  let pointsEarned = 0

  // ✅ Безопасное получение чисел с значениями по умолчанию
  const currentEnergy = Number(user.energy) || 1000
  const currentMaxEnergy = Number(user.maxEnergy) || 1000
  const currentLevel = Number(user.level) || 1
  const currentPoints = Number(user.points) || 0
  const currentPassiveRate = Number(user.passiveRate) || 0
  const currentTotalSpent = Number(user.totalSpent) || 0

  // ✅ amount уже число, так как в схеме Float
  const transactionAmount = Number(transaction.amount) || 0

  switch (effect) {
    case 'add_energy': {
      const newEnergy = Math.min(
        currentMaxEnergy,
        currentEnergy + Number(effectValue),
      )
      updateData.energy = newEnergy
      description = `Добавлено ${effectValue} энергии`
      break
    }

    case 'add_level': {
      const pointsToAdd = Number(effectValue) * 50
      updateData.level = currentLevel + Number(effectValue)
      updateData.points = currentPoints + pointsToAdd
      pointsEarned = pointsToAdd
      description = `Повышение уровня на ${effectValue} (+${pointsToAdd} очков)`
      break
    }

    case 'set_vip': {
      const days = Number(effectValue)
      updateData.vipUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      updateData.passiveRate = currentPassiveRate * 2
      description = `VIP на ${days} дней (+100% пассивного дохода)`
      break
    }

    case 'set_skin': {
      updateData.skin = effectValue
      updateData.points = currentPoints + 100
      pointsEarned = 100
      description = `Получен скин ${effectValue} (+100 очков)`
      break
    }

    case 'mega_pack': {
      updateData.energy = Math.min(currentMaxEnergy + 100, currentEnergy + 100)
      updateData.maxEnergy = currentMaxEnergy + 100
      updateData.level = currentLevel + 2
      updateData.points = currentPoints + 500
      updateData.passiveRate = currentPassiveRate * 2
      updateData.vipUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      updateData.skin = 'legendary'
      pointsEarned = 500
      description = 'Мега-пакет активирован!'
      break
    }

    default:
      throw new Error(`Unknown effect: ${effect}`)
  }

  // ✅ Добавляем totalSpent
  updateData.totalSpent = currentTotalSpent + transactionAmount

  // Обновляем пользователя
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })

  // ✅ Отмечаем транзакцию как примененную
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      applied: true,
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })

  // ✅ Записываем историю очков (если есть изменения)
  if (pointsEarned > 0) {
    await prisma.pointHistory.create({
      data: {
        userId,
        amount: pointsEarned,
        type: 'PURCHASE',
        description,
        transactionId,
      },
    })
  }

  return {
    success: true,
    description,
    pointsEarned,
    updatedUser,
  }
}
