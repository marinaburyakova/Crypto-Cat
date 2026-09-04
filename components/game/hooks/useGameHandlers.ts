// components/game/hooks/useGameHandlers.ts
'use client'

import { useCallback } from 'react'

interface UseGameHandlersProps {
  userId: string
  setEnergy: (value: number | ((prev: number) => number)) => void
  setPoints: (value: number | ((prev: number) => number)) => void
  setUserStars: (value: number | ((prev: number) => number)) => void
  setShowEnergyModal: (value: boolean) => void
  setIsBuyingEnergy: (value: boolean) => void
  setIsTonModalOpen: (value: boolean) => void
  showNotification: (type: any, message: string) => void
  fetchUserData: () => Promise<void>
}

export function useGameHandlers({
  userId,
  setEnergy,
  setPoints,
  setUserStars,
  setShowEnergyModal,
  setIsBuyingEnergy,
  setIsTonModalOpen,
  showNotification,
  fetchUserData,
}: UseGameHandlersProps) {
  
  // Покупка энергии за Stars
  const handleBuyEnergyStars = useCallback(async (amount: number) => {
    setIsBuyingEnergy(true)
    try {
      const response = await fetch('/api/payments/stars-energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка покупки')
      
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
  }, [userId, setEnergy, setPoints, setUserStars, setShowEnergyModal, setIsBuyingEnergy, showNotification])

  // Покупка энергии за TON
  const handleBuyEnergyTon = useCallback(async (amount: number) => {
    setIsBuyingEnergy(true)
    try {
      const response = await fetch('/api/payments/ton-energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка покупки за TON')
      
      if (data.tonUri) window.open(data.tonUri, '_blank')
      showNotification('info', '⏳ Ожидайте подтверждение оплаты TON...')
      setShowEnergyModal(false)
      setTimeout(() => fetchUserData(), 5000)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ошибка покупки за TON'
      showNotification('error', `❌ ${errorMsg}`)
    } finally {
      setIsBuyingEnergy(false)
    }
  }, [userId, setShowEnergyModal, setIsBuyingEnergy, showNotification, fetchUserData])

  // Открытие модалки TON
  const handleBuyBoost = useCallback(() => {
    setIsTonModalOpen(true)
  }, [setIsTonModalOpen])

  // Успешная покупка TON
  const handleTonSuccess = useCallback(() => {
    showNotification('success', '✅ Бустер TON активирован!')
    fetchUserData()
  }, [showNotification, fetchUserData])

  // Ошибка покупки TON
  const handleTonError = useCallback((error: string) => {
    showNotification('error', `❌ ${error}`)
  }, [showNotification])

  // Открытие модалки энергии
  const handleOpenEnergyModal = useCallback(() => {
    setShowEnergyModal(true)
  }, [setShowEnergyModal])

  return {
    handleBuyEnergyStars,
    handleBuyEnergyTon,
    handleBuyBoost,
    handleTonSuccess,
    handleTonError,
    handleOpenEnergyModal,
  }
}