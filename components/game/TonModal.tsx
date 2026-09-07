'use client'

import { X, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface TonModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSuccess: () => void
  onError: (error: string) => void
}

export function TonModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
  onError,
}: TonModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedBoost, setSelectedBoost] = useState<string | null>(null)

  if (!isOpen) return null

  // Цены строго синхронизированы с бэкенд-файлом products/route.ts
  const BOOSTS = [
    {
      id: 'boost_speed',
      name: 'Буст скорости',
      description: 'Кликай быстрее! Увеличивает скорость клика',
      priceTon: 1.0,
      icon: '🚀',
    },
    {
      id: 'boost_multiplier',
      name: 'Множитель дохода',
      description: 'Каждый клик приносит в 2 раза больше ⭐',
      priceTon: 3.0,
      icon: '💰',
    },
    {
      id: 'boost_passive',
      name: 'Пассивный доход',
      description: 'Кот приносит звёзды даже когда ты не кликаешь',
      priceTon: 5.0,
      icon: '🏠',
    },
    {
      id: 'boost_max_energy',
      name: 'Увеличение энергии',
      description: 'Максимальный запас энергии увеличивается',
      priceTon: 4.0,
      icon: '💪',
    },
  ]

  const handleBuyBoost = async (boost: typeof BOOSTS[0]) => {
    setSelectedBoost(boost.id)
    setIsLoading(true)

    try {
      const response = await fetch('/api/payments/buy-ton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          itemSku: boost.id, // 👈 Передаем артикул товара для правильной валидации на бэкенде
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа')
      }

      // Бэкенд возвращает ссылку на оплату в paymentLink или invoiceLink
      const link = data.paymentLink || data.invoiceLink

      if (link) {
        // Безопасный переход к оплате в Tonkeeper / Telegram Wallet
        window.location.href = link
        onSuccess?.()
        onClose()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка покупки'
      console.error('❌ TON boost error:', error)
      onError?.(errorMessage)
      alert(`❌ ${errorMessage}`)
    } finally {
      setIsLoading(false)
      setSelectedBoost(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl shadow-blue-500/20">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700/50"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30 font-sans text-white font-bold">
            TON
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Купить буст за TON</h3>
            <p className="text-sm text-slate-400">Улучши своего кота!</p>
          </div>
        </div>

        <div className="space-y-3">
          {BOOSTS.map((boost) => (
            <button
              key={boost.id}
              onClick={() => handleBuyBoost(boost)}
              disabled={isLoading}
              className="w-full p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all flex justify-between items-center"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{boost.icon}</span>
                <div className="text-left">
                  <span className="font-medium text-white">{boost.name}</span>
                  <span className="text-xs text-slate-400 block">{boost.description}</span>
                </div>
              </span>
              <span className="font-bold text-blue-400 min-w-[70px] text-right">
                {isLoading && selectedBoost === boost.id ? (
                  <Loader2 className="w-4 h-4 animate-spin inline-block" />
                ) : (
                  `${boost.priceTon} TON`
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-slate-800/50 rounded-xl">
          <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Оплата через Tonkeeper / Wallet.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          disabled={isLoading}
        >
          Отмена
        </button>
      </div>
    </div>
  )
}
