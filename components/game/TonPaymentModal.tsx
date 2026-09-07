'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { ShopItem } from '@/types/shop'

interface TonPaymentModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  item?: ShopItem
  itemPriceTon?: string
  itemSku?: string
  itemName?: string
  onSuccess: () => void
  onError: (error: string) => void
}

export function TonPaymentModal({
  userId,
  isOpen,
  onClose,
  item,
  itemPriceTon,
  itemSku,
  itemName,
  onSuccess,
  onError,
}: TonPaymentModalProps) {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [payload, setPayload] = useState<string | null>(null)

  // 🛡️ Хранилище для интервала, чтобы безопасно уничтожить его при закрытии модалки
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const getItemData = () => {
    if (item) {
      return {
        name: item.name,
        priceTon: item.priceTon,
        sku: item.id,
        category: item.category,
        effect: item.effect,
        effectValue: item.effectValue,
      }
    }
    return {
      name: itemName || 'Товар',
      priceTon: itemPriceTon || '0',
      sku: itemSku || 'unknown',
      category: 'other' as const,
      effect: 'other' as const,
      effectValue: 0,
    }
  }

  // 🛡️ Гарантированная очистка интервала при закрытии или уничтожении компонента
  const clearStatusCheck = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle')
      setErrorMessage(null)
      setPayload(null)
      clearStatusCheck() // 👈 Очищаем таймеры при закрытии
    }
    return () => clearStatusCheck() // 👈 Очищаем таймеры, если компонент удален со страницы
  }, [isOpen])

  const handlePayment = async () => {
    setStatus('loading')
    setErrorMessage(null)
    clearStatusCheck()

    try {
      const itemData = getItemData()
      console.log('🔄 Creating TON invoice for:', itemData.name)

      let type = 'other'
      if (itemData.category === 'energy') type = 'energy'
      else if (itemData.category === 'boost') type = 'boost'
      else if (itemData.category === 'level') type = 'level'
      else if (itemData.category === 'vip') type = 'vip'
      else if (itemData.category === 'skin') type = 'skin'

      const response = await fetch('/api/payments/buy-ton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          type: type,
          itemName: itemData.name,
          itemSku: itemData.sku,
          price: itemData.priceTon,
          data: {
            amount:
              itemData.category === 'energy' ? itemData.effectValue : undefined,
            effect: itemData.effect,
            value: itemData.effectValue,
          },
        }),
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('❌ Server returned non-JSON:', text)
        throw new Error('Сервер вернул ошибку. Попробуйте позже.')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа')
      }

      console.log('✅ Invoice created:', data)
      setPayload(data.payload)

      // 📲 Безопасный переход к кошельку. window.location.href надежнее для Telegram In-App чем window.open
      if (data.invoiceLink && typeof window !== 'undefined') {
        console.log('🔗 Opening TON invoice:', data.invoiceLink)
        window.location.href = data.invoiceLink
      }

      let attempts = 0
      const maxAttempts = 20 // Увеличено до 20 попыток (хватит на минуту ожидания)

      const checkStatus = async (): Promise<boolean> => {
        try {
          const statusResponse = await fetch(
            `/api/payments/check-status?memo=${data.payload}&userId=${userId}`,
          )
          const statusData = await statusResponse.json()

          console.log(`📊 Status check #${attempts + 1}:`, statusData.status)

          if (
            statusData.status === 'COMPLETED' ||
            statusData.status === 'SUCCESS'
          ) {
            setStatus('success')
            clearStatusCheck()
            onSuccess()
            return true
          } else if (
            statusData.status === 'FAILED' ||
            statusData.status === 'REFUNDED'
          ) {
            clearStatusCheck()
            throw new Error('Платёж не удался')
          }
          return false
        } catch (err) {
          console.error('❌ Status check error:', err)
          return false
        }
      }

      // Небольшая начальная пауза перед стартом опроса (пока кошелек открывается)
      await new Promise((resolve) => setTimeout(resolve, 4000))

      // Записываем интервал в ref-ссылку для контроля из любой части компонента
      intervalRef.current = setInterval(async () => {
        attempts++
        const done = await checkStatus()

        if (done || attempts >= maxAttempts) {
          clearStatusCheck()
          if (attempts >= maxAttempts && !done) {
            setStatus('error')
            setErrorMessage('Превышено время ожидания платежа')
            onError('Превышено время ожидания платежа')
          }
        }
      }, 3000)
    } catch (error) {
      clearStatusCheck()
      const message = error instanceof Error ? error.message : 'Ошибка оплаты'
      console.error('❌ Payment error:', message)
      setStatus('error')
      setErrorMessage(message)
      onError(message)
    }
  }

  if (!isOpen) return null

  const itemData = getItemData()

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          disabled={status === 'loading'}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">💎</div>
          <h2 className="text-xl font-bold text-white">Оплата TON</h2>
          <p className="text-slate-400 text-sm mt-1">
            {itemData.name} — {itemData.priceTon} TON
          </p>
        </div>

        {status === 'idle' && (
          <button
            onClick={handlePayment}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-xl transition-all active:scale-98"
          >
            Оплатить {itemData.priceTon} TON
          </button>
        )}

        {status === 'loading' && (
          <div className="text-center py-4">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-300 font-medium">Ожидание оплаты...</p>
            <p className="text-slate-500 text-sm mt-1">
              Подтвердите платеж в открывшемся кошельке TON
            </p>
            {payload && (
              <p className="text-slate-600 text-[10px] mt-4 break-all">
                ID: {payload}
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-4 text-slate-500 hover:text-slate-300 text-sm transition-colors block mx-auto underline"
            >
              Отменить операцию
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-green-400 font-bold text-lg">
              ✅ Оплата успешна!
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Товар активирован. Приятной игры! 🎮
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-bold">❌ Ошибка оплаты</p>
            <p className="text-slate-400 text-sm mt-1">{errorMessage}</p>
            <button
              onClick={() => {
                setStatus('idle')
                setErrorMessage(null)
              }}
              className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-xl transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
