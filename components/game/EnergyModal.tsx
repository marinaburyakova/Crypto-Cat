// components/game/EnergyModal.tsx
'use client'

import { X, Sparkles } from 'lucide-react'

const ENERGY_PRICES = {
  100: 0.99,
  500: 3.99,
  1000: 6.99,
  5000: 29.99,
} as const

type EnergyAmount = keyof typeof ENERGY_PRICES

interface EnergyModalProps {
  isOpen: boolean
  onClose: () => void
  currentEnergy: number
  maxEnergy: number
  onBuy: (amount: EnergyAmount) => Promise<void>
  isBuying: boolean
}

export function EnergyModal({ 
  isOpen, 
  onClose, 
  currentEnergy, 
  maxEnergy, 
  onBuy,
  isBuying 
}: EnergyModalProps) {
  if (!isOpen) return null

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

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/30">
            ⚡
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Купить энергию</h3>
            <p className="text-sm text-slate-400">
              Текущий баланс: <span className="text-cyan-400 font-bold">{currentEnergy} / {maxEnergy}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {Object.entries(ENERGY_PRICES).map(([amount, price]) => {
            const numAmount = parseInt(amount)
            const isMaxed = currentEnergy + numAmount > maxEnergy
            return (
              <button
                key={amount}
                onClick={() => onBuy(numAmount as EnergyAmount)}
                disabled={isBuying || isMaxed}
                className={`w-full text-white p-3.5 rounded-xl flex justify-between items-center transition-all ${
                  isMaxed 
                    ? 'bg-slate-800/50 opacity-40 cursor-not-allowed' 
                    : 'bg-slate-800 hover:bg-slate-700 active:scale-95 hover:shadow-lg hover:shadow-purple-500/20'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">⚡</span>
                  <span className="font-medium">{amount}</span>
                </span>
                <span className="text-yellow-400 font-bold">${price}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-[10px] text-amber-400 text-center flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3" />
            При покупке, если лимит превышен, ты сможешь увеличить максимум
          </p>
        </div>
      </div>
    </div>
  )
}