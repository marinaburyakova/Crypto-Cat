// components/game/GameModals.tsx
'use client'

import { EnergyModal } from './EnergyModal'
import { TonPaymentModal } from './TonPaymentModal'

interface GameModalsProps {
  showEnergyModal: boolean
  onCloseEnergy: () => void
  energy: number
  maxEnergy: number
  userStars: number
  onBuyStars: (amount: number) => Promise<void>
  onBuyTon: (amount: number) => Promise<void>
  isBuying: boolean

  showTonModal: boolean
  onCloseTon: () => void
  userId: string
  onTonSuccess: () => void
  onTonError: (error: string) => void
}

export function GameModals({
  showEnergyModal,
  onCloseEnergy,
  energy,
  maxEnergy,
  userStars,
  onBuyStars,
  onBuyTon,
  isBuying,
  showTonModal,
  onCloseTon,
  userId,
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
        onBuyStars={onBuyStars}
        onBuyTon={onBuyTon}
        isBuying={isBuying}
      />

      <TonPaymentModal
        userId={userId}
        isOpen={showTonModal}
        onClose={onCloseTon}
        itemPriceTon="0.5"
        itemSku="boost_x2"
        itemName="Бустер пассивного дохода x2"
        onSuccess={onTonSuccess}
        onError={onTonError}
      />
    </>
  )
}
