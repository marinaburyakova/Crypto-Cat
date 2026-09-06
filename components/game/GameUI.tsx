// components/game/GameUI.tsx
'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { GameLoader } from './GameLoader'
import { GameHeader } from './GameHeader'
import { GameStats } from './GameStats'
import { GamePlayArea } from './GamePlayArea'
import { GameBottomPanel } from './GameBottomPanel'
import { GameModals } from './GameModals'
import { GameScoreAnimation } from './GameScoreAnimation'
import { useGameLogic } from '@/hooks/useGameLogic'
import { useTelegram } from '@/hooks/useTelegram'
import { useNotification } from '@/components/ui/Notification'
import { getCatModel, getCatInfo, THRESHOLDS } from './GameConfig'
import { BottomNav } from '@/components/ui/BottomNav'

interface GameUIProps {
  userId: string
}

export function GameUI({ userId }: GameUIProps) {
  const { hapticFeedback, notificationFeedback } = useTelegram()
  const { showNotification, NotificationComponent } = useNotification()

  const isDemo = userId === 'demo'
  const isRegistered = userId !== 'demo' && userId !== ''

  const {
    points,
    energy,
    maxEnergy,
    level,
    exp,
    isLoading,
    error,
    comboCount,
    handleTap,
    fetchUserData,
    setEnergy,
    setPoints,
    setMaxEnergy,
  } = useGameLogic({
    userId,
    onNotification: showNotification,
    onHaptic: hapticFeedback,
    onNotificationFeedback: notificationFeedback,
  })

  const [showEnergyModal, setShowEnergyModal] = useState(false)
  const [isBuyingEnergy, setIsBuyingEnergy] = useState(false)
  const [isTonModalOpen, setIsTonModalOpen] = useState(false)
  const [scoreAnimation, setScoreAnimation] = useState(false)
  const [userStars, setUserStars] = useState(0)

  const catInfo = useMemo(() => getCatInfo(points), [points])
  const isSuperhero = points >= THRESHOLDS.SUPERHERO
  const isLegendary = points >= THRESHOLDS.LEGENDARY

  useEffect(() => {
    setUserStars(points)
  }, [points])

  // 🔥 ВРЕМЕННЫЕ ЦЕНЫ ДЛЯ ТЕСТА (5, 10, 20, 50 Stars)
  const getStarsPrice = (amount: number): number => {
    const prices: Record<number, number> = {
      100: 5,    // ← 5 Stars за 100 энергии
      500: 10,   // ← 10 Stars за 500 энергии
      1000: 20,  // ← 20 Stars за 1000 энергии
      5000: 50,  // ← 50 Stars за 5000 энергии
    }
    return prices[amount] || 0
  }

  const getTonPrice = (amount: number): number => {
    const prices: Record<number, number> = {
      100: 0.05,
      500: 0.10,
      1000: 0.20,
      5000: 0.50,
    }
    return prices[amount] || 0
  }

  // 🔥 НОВАЯ ФУНКЦИЯ покупки за Stars через универсальный эндпоинт
  const handleBuyEnergyStars = useCallback(
    async (amount: number) => {
      // Проверяем, не демо-режим ли
      if (isDemo) {
        showNotification(
          'warning',
          '⚠️ В демо-режиме покупка за Stars недоступна',
        )
        return
      }

      // Проверяем, не полна ли энергия
      if (energy >= maxEnergy) {
        showNotification('warning', '⚡ Энергия полна!')
        return
      }

      setIsBuyingEnergy(true)
      try {
        const price = getStarsPrice(amount)
        
        // 🔥 Используем НОВЫЙ универсальный эндпоинт
        const response = await fetch('/api/payments/buy-stars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            type: 'energy',
            itemName: `${amount} энергии`,
            itemSku: `energy_${amount}`,
            price: price,
            data: { amount: amount },
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Ошибка создания платежа')
        }

        if (data.invoiceLink) {
          // Открываем окно оплаты
          const invoiceWindow = window.open(data.invoiceLink, '_blank')
          if (!invoiceWindow) {
            throw new Error(
              'Не удалось открыть окно оплаты. Разрешите всплывающие окна.',
            )
          }

          showNotification('info', '⏳ Ожидайте подтверждение оплаты...')
          setShowEnergyModal(false)

          // Проверяем статус платежа
          const checkPayment = async () => {
            try {
              const statusResponse = await fetch(
                `/api/payments/check-status?memo=${data.payload}&userId=${userId}`,
              )
              const statusData = await statusResponse.json()

              if (statusData.success && statusData.status === 'COMPLETED') {
                showNotification('success', '✅ Энергия куплена!')
                await fetchUserData()
                return true
              }
              return false
            } catch (error) {
              console.error('❌ Status check error:', error)
              return false
            }
          }

          // Проверяем статус каждые 5 секунд
          let attempts = 0
          const maxAttempts = 12
          const interval = setInterval(async () => {
            attempts++
            const completed = await checkPayment()
            if (completed || attempts >= maxAttempts) {
              clearInterval(interval)
              if (attempts >= maxAttempts && !completed) {
                showNotification(
                  'warning',
                  '⏳ Время ожидания истекло. Проверьте баланс позже.',
                )
              }
            }
          }, 5000)
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Ошибка покупки'
        showNotification('error', `❌ ${errorMsg}`)
      } finally {
        setIsBuyingEnergy(false)
      }
    },
    [userId, isDemo, energy, maxEnergy, showNotification, fetchUserData],
  )

  const handleBuyEnergyTon = useCallback(
    async (amount: number) => {
      setIsBuyingEnergy(true)
      try {
        const price = getTonPrice(amount)
        
        // 🔥 Используем НОВЫЙ универсальный эндпоинт для TON
        const response = await fetch('/api/payments/buy-ton', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            type: 'energy',
            itemName: `${amount} энергии`,
            itemSku: `energy_${amount}`,
            price: price.toString(),
            data: { amount: amount },
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Ошибка создания платежа')
        }

        if (data.invoiceLink) {
          window.open(data.invoiceLink, '_blank')
          showNotification('info', '⏳ Ожидайте подтверждение оплаты TON...')
          setShowEnergyModal(false)
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Ошибка покупки за TON'
        showNotification('error', `❌ ${errorMsg}`)
      } finally {
        setIsBuyingEnergy(false)
      }
    },
    [userId, showNotification],
  )

  const handleBuyBoost = useCallback(() => {
    setIsTonModalOpen(true)
  }, [])

  const handleTonSuccess = useCallback(() => {
    showNotification('success', '✅ Бустер TON активирован!')
    notificationFeedback('success')
    fetchUserData()
  }, [fetchUserData, showNotification, notificationFeedback])

  const handleTonError = useCallback(
    (error: string) => {
      showNotification('error', `❌ ${error}`)
    },
    [showNotification],
  )

  if (isLoading) {
    return <GameLoader />
  }

  return (
    <div className="relative flex flex-col h-screen w-full bg-zinc-950">
      {NotificationComponent}

      <GameScoreAnimation
        points={points}
        onAnimationChange={setScoreAnimation}
      />

      <GameHeader
        level={level}
        points={points}
        scoreAnimation={scoreAnimation}
        catInfo={catInfo}
        isLegendary={isLegendary}
      />

      <GameStats
        exp={exp}
        maxExp={500}
        error={error}
        onRetry={fetchUserData}
      />

      <GamePlayArea
        emotion="idle"
        energy={energy}
        onTap={handleTap}
        catModel={getCatModel(points)}
        catInfo={catInfo}
        isSuperhero={isSuperhero}
        isLegendary={isLegendary}
        comboCount={comboCount}
        points={points}
      />

      <GameBottomPanel
        energy={energy}
        maxEnergy={maxEnergy}
        isBuyingEnergy={isBuyingEnergy}
        onBuyEnergy={() => setShowEnergyModal(true)}
        onBuyBoost={handleBuyBoost}
        isRegistered={isRegistered}
      />

      <GameModals
        showEnergyModal={showEnergyModal}
        onCloseEnergy={() => setShowEnergyModal(false)}
        energy={energy}
        maxEnergy={maxEnergy}
        userStars={userStars}
        userId={userId}
        isRegistered={isRegistered}
        onBuyStars={handleBuyEnergyStars}
        onBuyTon={handleBuyEnergyTon}
        isBuying={isBuyingEnergy}
        showTonModal={isTonModalOpen}
        onCloseTon={() => setIsTonModalOpen(false)}
        onTonSuccess={handleTonSuccess}
        onTonError={handleTonError}
      />

      <BottomNav activeTab="game" />
    </div>
  )
}