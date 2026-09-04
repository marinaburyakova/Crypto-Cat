// components/game/GameActions.tsx
'use client'

import { ShoppingBag, Zap } from 'lucide-react'
import { StarsPaymentButton } from './StarsPaymentButton'

interface GameActionsProps {
  onBuyEnergy: () => void
  isBuyingEnergy: boolean
  onBuyBoost: () => void
  userId: string
  onLevelUp: () => void
}

export function GameActions({ 
  onBuyEnergy, 
  isBuyingEnergy, 
  onBuyBoost,
  userId,
  onLevelUp
}: GameActionsProps) {
  return (
    <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/80 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onBuyEnergy}
          disabled={isBuyingEnergy}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-lg shadow-yellow-500/20 transition-all active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          {isBuyingEnergy ? '...' : 'Энергия'}
        </button>

        <button
          onClick={onBuyBoost}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all text-sm"
        >
          <Zap className="w-4 h-4" />
          Буст (TON)
        </button>
      </div>

      <StarsPaymentButton
        userId={userId}
        itemPriceStars={50}
        itemSku="cat_level_up"
        itemName="Повысить Уровень Кота"
        onSuccess={onLevelUp}
      />
    </div>
  )
}