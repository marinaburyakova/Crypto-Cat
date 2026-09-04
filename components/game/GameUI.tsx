// components/game/GameUI.tsx
'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { GameLoader } from './GameLoader'
import { GameHeader } from './GameHeader'
import { GameStats } from './GameStats'
import { GamePlayArea } from './GamePlayArea'
import { GameBottomPanel } from './GameBottomPanel'
import { GameModals } from './GameModals'
import { GameAchievementNotifier } from './GameAchievementNotifier'
import { GameScoreAnimation } from './GameScoreAnimation'
import { useGameHandlers } from './hooks/useGameHandlers'
import { useGameLogic } from '@/hooks/useGameLogic'
import { useTelegram } from '@/hooks/useTelegram'
import { useNotification } from '@/components/ui/Notification'
import { getCatModel, getCatInfo } from './GameConfig'
import { BottomNav } from '@/components/ui/BottomNav'

interface GameUIProps {
  userId: string
}

export function GameUI({ userId }: GameUIProps) {
  const { hapticFeedback, notificationFeedback } = useTelegram()
  const { showNotification, NotificationComponent } = useNotification()

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
  const isSuperhero = points >= 50
  const isLegendary = points >= 1000

  useEffect(() => {
    setUserStars(points)
  }, [points])

  // ============================================================
  // ✅ ПОКУПКА ЭНЕРГИИ ЗА STARS
  // ============================================================
  const handleBuyEnergyStars = useCallback(async (amount: number) => {
    setIsBuyingEnergy(true)
    try {
      const response = await fetch('/api/payments/energy/buy-stars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка покупки')
      }

      setEnergy(data.energy)
      setPoints(data.starsRemaining)
      setUserStars(data.starsRemaining)

      showNotification('success', `✅ Куплено ${data.energyAdded} энергии!`)
      setShowEnergyModal(false)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ошибка покупки'
      showNotification('error', `❌ ${errorMsg}`)
    } finally {
      setIsBuyingEnergy(false)
    }
  }, [userId, setEnergy, setPoints, showNotification])

  // ============================================================
  // ✅ ПОКУПКА ЭНЕРГИИ ЗА TON
  // ============================================================
  const handleBuyEnergyTon = useCallback(async (amount: number) => {
    setIsBuyingEnergy(true)
    try {
      const response = await fetch('/api/payments/energy/buy-ton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка покупки за TON')
      }

      if (data.tonUri) {
        window.open(data.tonUri, '_blank')
      }

      showNotification('info', '⏳ Ожидайте подтверждение оплаты TON...')
      setShowEnergyModal(false)

      // Проверяем статус через 10 секунд
      setTimeout(async () => {
        const statusResponse = await fetch(
          `/api/payments/check-status?payload=${data.memo}&userId=${userId}`
        )
        const statusData = await statusResponse.json()
        if (statusData.status === 'SUCCESS' || statusData.status === 'COMPLETED') {
          showNotification('success', '✅ Оплата TON подтверждена!')
          fetchUserData()
        }
      }, 10000)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ошибка покупки за TON'
      showNotification('error', `❌ ${errorMsg}`)
    } finally {
      setIsBuyingEnergy(false)
    }
  }, [userId, showNotification, fetchUserData])

  // ============================================================
  // ✅ БУСТ ЗА TON
  // ============================================================
  const handleBuyBoost = useCallback(() => {
    setIsTonModalOpen(true)
  }, [])

  const handleTonSuccess = useCallback(() => {
    showNotification('success', '✅ Бустер TON активирован!')
    notificationFeedback('success')
    fetchUserData()
  }, [fetchUserData, showNotification, notificationFeedback])

  const handleTonError = useCallback((error: string) => {
    showNotification('error', `❌ ${error}`)
  }, [showNotification])

  // ============================================================
  // ОТРИСОВКА
  // ============================================================
  
  if (isLoading) {
    return <GameLoader />
  }

  return (
    <div className="relative flex flex-col h-full w-full">
      {NotificationComponent}

      <GameAchievementNotifier
        points={points}
        isLegendary={isLegendary}
        showNotification={showNotification}
        notificationFeedback={notificationFeedback}
        hapticFeedback={hapticFeedback}
      />

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
      />

      <GameBottomPanel
        energy={energy}
        maxEnergy={maxEnergy}
        isBuyingEnergy={isBuyingEnergy}
        onBuyEnergy={() => setShowEnergyModal(true)}
        onBuyBoost={handleBuyBoost}
      />

      <GameModals
        showEnergyModal={showEnergyModal}
        onCloseEnergy={() => setShowEnergyModal(false)}
        energy={energy}
        maxEnergy={maxEnergy}
        userStars={userStars}
        onBuyStars={handleBuyEnergyStars}
        onBuyTon={handleBuyEnergyTon}
        isBuying={isBuyingEnergy}
        showTonModal={isTonModalOpen}
        onCloseTon={() => setIsTonModalOpen(false)}
        userId={userId}
        onTonSuccess={handleTonSuccess}
        onTonError={handleTonError}
      />

      <BottomNav activeTab="game" />
    </div>
  )
}