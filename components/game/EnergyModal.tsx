// components/game/EnergyModal.tsx
'use client'

import { useState } from 'react'
import { X, Sparkles, Loader2, Zap } from 'lucide-react'

// Цены в Stars
const STARS_PRICES = {
  100: 50,
  500: 200,
  1000: 350,
  5000: 1500,
} as const

// Цены в TON
const TON_PRICES = {
  100: 0.5,
  500: 2.0,
  1000: 3.5,
  5000: 15.0,
} as const

type EnergyAmount = keyof typeof STARS_PRICES

interface EnergyModalProps {
  isOpen: boolean
  onClose: () => void
  currentEnergy: number
  maxEnergy: number
  userStars: number
  onBuyStars: (amount: EnergyAmount) => Promise<void>
  onBuyTon: (amount: EnergyAmount) => Promise<void>
  isBuying: boolean
}

export function EnergyModal({ 
  isOpen, 
  onClose, 
  currentEnergy, 
  maxEnergy,
  userStars,
  onBuyStars,
  onBuyTon,
  isBuying 
}: EnergyModalProps) {
  const [activeTab, setActiveTab] = useState<'stars' | 'ton'>('stars')

  if (!isOpen) return null

  const isEnergyFull = currentEnergy >= maxEnergy

  const canAffordStars = (price: number) => userStars >= price

  const formatTonPrice = (price: number) => price.toFixed(1)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl shadow-purple-500/20">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700/50"
          disabled={isBuying}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/30">
            ⚡
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Купить энергию</h3>
            <p className="text-sm text-slate-400">
              Баланс: <span className="text-yellow-400 font-bold">{userStars.toLocaleString()} ⭐</span>
            </p>
            <p className="text-xs text-slate-500">
              Энергия: <span className="text-cyan-400">{currentEnergy} / {maxEnergy}</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 bg-slate-800/50 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('stars')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'stars'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⭐ Stars
          </button>
          <button
            onClick={() => setActiveTab('ton')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'ton'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ₿ TON
          </button>
        </div>

        {/* Список цен */}
        <div className="space-y-2.5">
          {Object.entries(activeTab === 'stars' ? STARS_PRICES : TON_PRICES).map(([amount, price]) => {
            const numAmount = parseInt(amount)
            const isMaxed = isEnergyFull
            const hasEnough = activeTab === 'stars' ? canAffordStars(price) : true
            const isDisabled = isBuying || isMaxed || !hasEnough

            return (
              <button
                key={amount}
                onClick={() => {
                  if (activeTab === 'stars') {
                    onBuyStars(numAmount as EnergyAmount)
                  } else {
                    onBuyTon(numAmount as EnergyAmount)
                  }
                }}
                disabled={isDisabled}
                className={`w-full p-3.5 rounded-xl flex justify-between items-center transition-all ${
                  isDisabled
                    ? 'bg-slate-800/50 opacity-40 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 active:scale-95 hover:shadow-lg hover:shadow-purple-500/20'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">⚡</span>
                  <div className="text-left">
                    <span className="font-medium text-white">{amount}</span>
                    <span className="text-xs text-slate-500 block">
                      {isMaxed 
                        ? '❌ Максимум' 
                        : !hasEnough && activeTab === 'stars' 
                          ? '❌ Не хватает ⭐' 
                          : ''}
                    </span>
                  </div>
                </span>
                <span className={`font-bold flex items-center gap-1 ${
                  activeTab === 'stars' ? 'text-yellow-400' : 'text-blue-400'
                }`}>
                  {activeTab === 'stars' ? `${price} ⭐` : `${formatTonPrice(price)} ₿`}
                </span>
              </button>
            )
          })}
        </div>

        {/* Инфо */}
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-[10px] text-amber-400 text-center flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3" />
            {activeTab === 'stars' 
              ? 'Покупайте энергию за Stars и тапайте без остановки!' 
              : 'Покупайте энергию за TON и получайте +20% бонусных очков!'}
          </p>
        </div>

        {/* Текущий баланс */}
        <div className="mt-3 flex justify-between text-xs text-slate-500">
          <span>⭐ {userStars.toLocaleString()}</span>
          <span>⚡ {currentEnergy} / {maxEnergy}</span>
        </div>
      </div>
    </div>
  )
}