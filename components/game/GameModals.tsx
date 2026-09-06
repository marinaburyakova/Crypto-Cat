// components/game/GameModals.tsx
'use client'

import { EnergyModal } from './EnergyModal'
import { TonModal } from './TonModal'

interface GameModalsProps {
  showEnergyModal: boolean
  onCloseEnergy: () => void
  energy: number
  maxEnergy: number
  userStars: number
  userId: string
  isRegistered: boolean  // 🔥 Добавлено
  onBuyStars: (amount: number) => Promise<void>
  onBuyTon: (amount: number) => Promise<void>
  isBuying: boolean
  showTonModal: boolean
  onCloseTon: () => void
  onTonSuccess: () => void
  onTonError: (error: string) => void
}

export function GameModals({
  showEnergyModal,
  onCloseEnergy,
  energy,
  maxEnergy,
  userStars,
  userId,
  isRegistered,
  onBuyStars,
  onBuyTon,
  isBuying,
  showTonModal,
  onCloseTon,
  onTonSuccess,
  onTonError,
}: GameModalsProps) {
  return (
    <>
      <EnergyModal
        isOpen={showEnergyModal}
        onClose={onCloseEnergy}
        currentEnergy={energy}
        maxEnergy={maxEnergy}
        userStars={userStars}
        userId={userId}
        isRegistered={isRegistered}
        onBuyStars={onBuyStars}
        onBuyTon={onBuyTon}
        isBuying={isBuying}
      />

      <TonModal
        isOpen={showTonModal}
        onClose={onCloseTon}
        userId={userId}
        isRegistered={isRegistered}
        onSuccess={onTonSuccess}
        onError={onTonError}
      />
    </>
  )
}