
'use client'

import { useState, useMemo, useEffect } from 'react'
import { GameContainer } from './GameContainer'
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
import { BottomNav } from '@/components/ui/BottomNav'  // ✅ ДОБАВЛЕНО

interface GameUIProps {
  userId: string
}

export function GameUI({ userId }: GameUIProps) {
  // ============================================================
  // ХУКИ
  // ============================================================
  
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

  // ============================================================
  // СОСТОЯНИЯ
  // ============================================================
  
  const [showEnergyModal, setShowEnergyModal] = useState(false)
  const [isBuyingEnergy, setIsBuyingEnergy] = useState(false)
  const [isTonModalOpen, setIsTonModalOpen] = useState(false)
  const [scoreAnimation, setScoreAnimation] = useState(false)
  const [userStars, setUserStars] = useState(0)

  // ============================================================
  // МЕМО
  // ============================================================
  
  const catInfo = useMemo(() => getCatInfo(points), [points])
  const isSuperhero = points >= 50
  const isLegendary = points >= 1000

  // ============================================================
  // ЭФФЕКТЫ
  // ============================================================
  
  useEffect(() => {
    setUserStars(points)
  }, [points])

  // ============================================================
  // ХУК ОБРАБОТЧИКОВ
  // ============================================================
  
  const {
    handleBuyEnergyStars,
    handleBuyEnergyTon,
    handleBuyBoost,
    handleTonSuccess,
    handleTonError,
    handleOpenEnergyModal,
  } = useGameHandlers({
    userId,
    setEnergy,
    setPoints,
    setUserStars,
    setShowEnergyModal,
    setIsBuyingEnergy,
    setIsTonModalOpen,
    showNotification,
    fetchUserData,
  })

  // ============================================================
  // ЗАГРУЗКА
  // ============================================================
  
  if (isLoading) {
    return <GameLoader />
  }

  // ============================================================
  // ОТРИСОВКА
  // ============================================================
  
  return (
    <div className="relative flex flex-col h-full w-full">
      {/* Уведомления */}
      {NotificationComponent}

      {/* Уведомления о достижениях */}
      <GameAchievementNotifier
        points={points}
        isLegendary={isLegendary}
        showNotification={showNotification}
        notificationFeedback={notificationFeedback}
        hapticFeedback={hapticFeedback}
      />

      {/* Анимация счета */}
      <GameScoreAnimation
        points={points}
        onAnimationChange={setScoreAnimation}
      />

      {/* Шапка */}
      <GameHeader
        level={level}
        points={points}
        scoreAnimation={scoreAnimation}
        catInfo={catInfo}
        isLegendary={isLegendary}
      />

      {/* Статистика */}
      <GameStats
        exp={exp}
        maxExp={500}
        error={error}
        onRetry={fetchUserData}
      />

      {/* Игровое поле */}
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

      {/* Нижняя панель */}
      <GameBottomPanel
        energy={energy}
        maxEnergy={maxEnergy}
        isBuyingEnergy={isBuyingEnergy}
        onBuyEnergy={handleOpenEnergyModal}
        onBuyBoost={handleBuyBoost}
      />

      {/* Модалки */}
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

      {/* ✅ НИЖНЯЯ НАВИГАЦИЯ - ДОБАВЛЕНО */}
      <BottomNav activeTab="game" />
    </div>
  )
}