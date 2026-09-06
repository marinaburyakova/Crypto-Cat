// components/game/StarsPaymentButton.tsx
'use client'

import { useState } from 'react'

interface StarsPaymentButtonProps {
  userId: string
  itemPriceStars: number
  itemSku: string
  itemName: string
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
  children?: React.ReactNode
}

// 🔥 Маппинг: цена в Stars → количество энергии
const ENERGY_BY_PRICE: Record<number, number> = {
  50: 100,
  200: 500,
  350: 1000,
  1500: 5000,
}

export function StarsPaymentButton({
  userId,
  itemPriceStars,
  itemSku,
  itemName,
  onSuccess,
  onError,
  className = '',
  disabled = false,
  children,
}: StarsPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async () => {
    setError(null)
    setIsLoading(true)

    try {
      if (!userId) {
        throw new Error('ID пользователя не указан')
      }

      if (!itemSku) {
        throw new Error('SKU товара не указан')
      }

      if (itemPriceStars <= 0) {
        throw new Error('Некорректная цена товара')
      }

      // 🔥 Получаем количество энергии по цене
      const energyAmount = ENERGY_BY_PRICE[itemPriceStars]
      if (!energyAmount) {
        throw new Error(`Неизвестная цена: ${itemPriceStars} Stars`)
      }

      const response = await fetch('/api/payments/energy/buy-stars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          amount: energyAmount, // ← Отправляем количество энергии
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа')
      }

      if (!data.invoiceLink) {
        throw new Error('Ссылка на оплату не получена')
      }

      const invoiceWindow = window.open(data.invoiceLink, '_blank')

      if (!invoiceWindow) {
        throw new Error(
          'Не удалось открыть окно оплаты. Разрешите всплывающие окна.',
        )
      }

      onSuccess?.()
      startPaymentStatusCheck(data.payload, data.transactionId)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ошибка при покупке'
      console.error('❌ Purchase error:', error)
      setError(errorMessage)

      if (onError) {
        onError(errorMessage)
      } else {
        alert(`❌ ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const startPaymentStatusCheck = (payload: string, transactionId?: string) => {
    let attempts = 0
    const maxAttempts = 60
    const intervalId = setInterval(async () => {
      attempts++

      try {
        const response = await fetch(
          `/api/payments/check-status?memo=${payload}&userId=${userId}`,
        )
        const data = await response.json()

        if (data.success && data.status === 'SUCCESS') {
          clearInterval(intervalId)
          console.log('✅ Payment confirmed!')

          onSuccess?.()
          alert('✅ Платеж успешно подтвержден!')

          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }

        if (data.status === 'FAILED' || data.status === 'REFUNDED') {
          clearInterval(intervalId)
          console.warn('⚠️ Payment failed or refunded')

          const errorMessage =
            data.status === 'FAILED'
              ? 'Платеж не удался'
              : 'Платеж был возвращен'

          if (onError) {
            onError(errorMessage)
          }
        }

        if (attempts >= maxAttempts) {
          clearInterval(intervalId)
          console.warn('⚠️ Payment status check timeout')

          if (onError) {
            onError('Превышено время ожидания подтверждения платежа')
          }
        }
      } catch (error) {
        console.error('❌ Status check error:', error)

        if (attempts >= maxAttempts) {
          clearInterval(intervalId)
          if (onError) {
            onError('Ошибка проверки статуса платежа')
          }
        }
      }
    }, 5000)

    return () => clearInterval(intervalId)
  }

  const LoadingContent = () => (
    <span className="flex items-center gap-2">
      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
      Обработка...
    </span>
  )

  const ErrorContent = () => (
    <span className="flex items-center gap-2 text-red-300">
      <span className="text-sm">⚠️</span>
      Ошибка
    </span>
  )

  return (
    <div className="w-full">
      <button
        onClick={handlePurchase}
        disabled={isLoading || disabled}
        className={`
          w-full bg-gradient-to-r from-purple-600 to-purple-700 
          hover:from-purple-700 hover:to-purple-800 
          text-white font-bold py-2.5 px-4 rounded-xl 
          shadow-lg shadow-purple-500/30 
          transition-all duration-200 
          active:scale-95 
          text-xs sm:text-sm 
          flex items-center justify-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900
          ${className}
        `}
        aria-label={`Купить ${itemName} за ${itemPriceStars} Stars`}
      >
        {isLoading ? (
          <LoadingContent />
        ) : error ? (
          <ErrorContent />
        ) : children ? (
          children
        ) : (
          <span className="flex items-center gap-2">
            <span className="text-yellow-400">⭐</span>
            {itemPriceStars} Stars
            <span className="text-purple-300 text-[10px] hidden sm:inline">
              · {itemName}
            </span>
          </span>
        )}
      </button>

      {error && !onError && (
        <div className="mt-2 text-xs text-red-400 text-center animate-fadeIn">
          ❌ {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-2 text-[10px] text-slate-500 text-center animate-pulse">
          ⌛ Ожидание подтверждения платежа...
        </div>
      )}
    </div>
  )
}

const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`
