// components/game/GameBottomPanel.tsx
'use client'

import { EnergyBar } from './EnergyBar'
import { ShoppingBag } from 'lucide-react'

interface GameBottomPanelProps {
  energy: number
  maxEnergy: number
  isBuyingEnergy: boolean
  onBuyEnergy: () => void
  onBuyBoost: () => void
}

export function GameBottomPanel({
  energy,
  maxEnergy,
  isBuyingEnergy,
  onBuyEnergy,
  onBuyBoost,
}: GameBottomPanelProps) {
  return (
    <div className="space-y-2 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800/50 px-4 pb-3">
      <div className="pt-2">
        <EnergyBar current={energy} max={maxEnergy} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onBuyEnergy}
          disabled={isBuyingEnergy}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-lg shadow-yellow-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <ShoppingBag className="w-4 h-4" />
          {isBuyingEnergy ? '...' : 'Энергия ⭐'}
        </button>

        <button
          onClick={onBuyBoost}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          <span className="text-sm">₿</span>
          Буст (TON)
        </button>
      </div>
    </div>
  )
}