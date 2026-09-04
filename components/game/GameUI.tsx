// components/game/GameUI.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { GameField } from './game-field'
import { EnergyBar } from './EnergyBar'
import { GameHeader } from './GameHeader'
import { GameStats } from './GameStats'
import { GameCombo } from './GameCombo'
import { GameHeroBadge } from './GameHeroBadge'
import { GameActions } from './GameActions'
import { EnergyModal } from './EnergyModal'
import { TonPaymentModal } from './TonPaymentModal'
import { useGameLogic } from '@/hooks/useGameLogic'
import { useTelegram } from '@/hooks/useTelegram'
import { useNotification } from '@/components/ui/Notification'

const CAT_MODELS = {
  default: '/assets/models/cat.glb',
  superhero: '/assets/models/cat_superhero.glb',
  legendary: '/assets/models/cat_legendary.glb',
} as const

const getCatModel = (score: number): string => {
  if (score >= 1000) return CAT_MODELS.legendary
  if (score >= 50) return CAT_MODELS.superhero
  return CAT_MODELS.default
}

const getCatInfo = (score: number) => {
  if (score >= 1000) {
    return {
      name: 'Легендарный кот',
      emoji: '👑',
      text: 'Повелитель вселенной! 🌟', // ✅ Добавлено поле text
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
    }
  }
  if (score >= 50) {
    return {
      name: 'Кот-супергерой',
      emoji: '🦸‍♂️',
      text: 'Спасает мир от скуки! ⚡', // ✅ Добавлено поле text
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
    }
  }
  return {
    name: 'Кибер-кот',
    emoji: '🐱',
    text: 'Твой верный друг! 🐾', // ✅ Добавлено поле text
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
  }
}

interface GameUIProps {
  userId: string
}

export function GameUI({ userId }: GameUIProps) {
  console.log('🎮 GameUI mounted with userId:', userId) // ✅ Добавьте
  const { hapticFeedback, notificationFeedback, showAlert, showConfirm } =
    useTelegram()
  const { showNotification, NotificationComponent } = useNotification()
  console.log('📢 useNotification ready') // ✅ Добавьте
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
    onNotification: showNotification, // ✅ Теперь типы совпадают
    onHaptic: hapticFeedback, // ✅ Теперь типы совпадают
    onNotificationFeedback: notificationFeedback, // ✅ Теперь типы совпадают
  })
  console.log('🎮 GameLogic state:', { points, energy, isLoading }) // ✅ Добавьте
  const [showEnergyModal, setShowEnergyModal] = useState(false)
  const [isBuyingEnergy, setIsBuyingEnergy] = useState(false)
  const [isTonModalOpen, setIsTonModalOpen] = useState(false)
  const [scoreAnimation, setScoreAnimation] = useState(false)

  const catInfo = useMemo(() => getCatInfo(points), [points])
  const isSuperhero = points >= 50

  // Анимация счета
  useEffect(() => {
    if (points > 0) {
      setScoreAnimation(true)
      const timer = setTimeout(() => setScoreAnimation(false), 300)
      return () => clearTimeout(timer)
    }
  }, [points])

  // Покупка энергии
  const handleBuyEnergy = useCallback(
    async (amount: number) => {
      setIsBuyingEnergy(true)
      try {
        const newEnergy = energy + amount
        if (newEnergy > maxEnergy) {
          const shouldUpgrade = await showConfirm(
            `⚠️ Максимум ${maxEnergy} энергии. Хочешь увеличить до ${maxEnergy + amount}?`,
          )
          if (shouldUpgrade === true) {
            setMaxEnergy((prev) => prev + amount)
            setEnergy((prev) => Math.min(prev + amount, prev + amount))
            showNotification(
              'success',
              `✅ Максимум увеличен до ${maxEnergy + amount}!`,
            )
          }
          return
        }
        setEnergy((prev) => Math.min(maxEnergy, prev + amount))
        showNotification('success', `✅ Куплено ${amount} энергии!`)
        setShowEnergyModal(false)
      } catch (err) {
        showNotification('error', '❌ Ошибка покупки энергии')
      } finally {
        setIsBuyingEnergy(false)
      }
    },
    [energy, maxEnergy, showConfirm, showNotification, setEnergy, setMaxEnergy],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl animate-pulse">🐱</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium">Загрузка игры...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full w-full">
      {NotificationComponent}

      <EnergyModal
        isOpen={showEnergyModal}
        onClose={() => setShowEnergyModal(false)}
        currentEnergy={energy}
        maxEnergy={maxEnergy}
        onBuy={handleBuyEnergy}
        isBuying={isBuyingEnergy}
      />

      <TonPaymentModal
        userId={userId}
        isOpen={isTonModalOpen}
        onClose={() => setIsTonModalOpen(false)}
        itemPriceTon="0.5"
        itemSku="boost_x2"
        itemName="Бустер пассивного дохода x2"
        onSuccess={() => {
          showNotification('success', '✅ Бустер активирован!')
          notificationFeedback('success')
        }}
      />

      <GameHeader
        level={level}
        points={points}
        scoreAnimation={scoreAnimation}
        catInfo={catInfo}
      />

      <GameStats
        exp={exp}
        maxExp={500}
        error={error}
        onRetry={fetchUserData}
      />

      <div className="flex-1 relative overflow-hidden">
        <GameField
          emotion="idle"
          energy={energy}
          onTap={handleTap}
          catModel={getCatModel(points)}
          catInfo={catInfo}
          isSuperhero={isSuperhero}
        />

        <GameCombo count={comboCount} />
        <GameHeroBadge
          isSuperhero={isSuperhero}
          catInfo={catInfo}
        />
      </div>

      <div className="px-4 py-2">
        <EnergyBar
          current={energy}
          max={maxEnergy}
        />
      </div>

      <GameActions
        onBuyEnergy={() => setShowEnergyModal(true)}
        isBuyingEnergy={isBuyingEnergy}
        onBuyBoost={() => setIsTonModalOpen(true)}
        userId={userId}
        onLevelUp={() => {
          showNotification('success', '✅ Уровень повышен!')
          notificationFeedback('success')
          fetchUserData()
        }}
      />
    </div>
  )
}
