// components/game/GameBottomPanel.tsx
'use client'

import { EnergyBar } from './EnergyBar'
import { ShoppingBag, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GameBottomPanelProps {
  energy: number
  maxEnergy: number
  isBuyingEnergy: boolean
  onBuyEnergy: () => void
  onBuyBoost: () => void
  isRegistered: boolean  // 🔥 Добавлено
}

export function GameBottomPanel({
  energy,
  maxEnergy,
  isBuyingEnergy,
  onBuyEnergy,
  onBuyBoost,
  isRegistered,
}: GameBottomPanelProps) {
  const router = useRouter()

  return (
    <div className="space-y-2 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800/50 px-4 pb-3">
      <div className="pt-2">
        <EnergyBar current={energy} max={maxEnergy} />
      </div>

      {/* 🔥 Баннер для незарегистрированных */}
      {!isRegistered && (
        <div className="p-2.5 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/20 rounded-lg flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-[10px] text-amber-400/90 flex-1">
            🔒 Войдите в аккаунт, чтобы покупать энергию и бусты
          </p>
          <button
            onClick={() => router.push('/login')}
            className="text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
          >
            Войти →
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Кнопка "Энергия ⭐" */}
        <button
          onClick={isRegistered ? onBuyEnergy : () => router.push('/login')}
          disabled={isBuyingEnergy || !isRegistered}
          className={`
            flex items-center justify-center gap-2 
            bg-gradient-to-r from-yellow-500 to-orange-500 
            text-white font-bold py-2.5 px-4 rounded-xl text-sm 
            shadow-lg shadow-yellow-500/20 
            transition-all active:scale-95 
            disabled:opacity-40 disabled:cursor-not-allowed
            ${!isRegistered && 'hover:brightness-110'}
          `}
        >
          <ShoppingBag className="w-4 h-4" />
          {isBuyingEnergy ? '...' : 'Энергия ⭐'}
          {!isRegistered && <Lock className="w-3 h-3 ml-1" />}
        </button>

        {/* Кнопка "Буст (TON)" */}
        <button
          onClick={isRegistered ? onBuyBoost : () => router.push('/login')}
          disabled={!isRegistered}
          className={`
            flex items-center justify-center gap-2 
            bg-gradient-to-r from-blue-600 to-blue-700 
            text-white font-bold py-2.5 px-4 rounded-xl text-sm 
            shadow-lg shadow-blue-500/20 
            transition-all active:scale-95 
            disabled:opacity-40 disabled:cursor-not-allowed
            ${!isRegistered && 'hover:brightness-110'}
          `}
        >
          <span className="text-sm">₿</span>
          Буст (TON)
          {!isRegistered && <Lock className="w-3 h-3 ml-1" />}
        </button>
      </div>
    </div>
  )
}