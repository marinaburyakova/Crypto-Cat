'use client'

import { useState } from 'react'

interface StarsPaymentButtonProps {
  userId: string
  itemPriceStars: number
  itemSku: string
  itemName: string
  itemCategory?: string
  itemEffect?: string
  itemEffectValue?: any
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
  children?: React.ReactNode
}

export function StarsPaymentButton({
  userId,
  itemPriceStars,
  itemSku,
  itemName,
  itemCategory = 'other',
  itemEffect = '',
  itemEffectValue = 0,
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
      if (!userId) throw new Error('ID пользователя не указан')
      if (!itemSku) throw new Error('SKU товара не указан')
      if (itemPriceStars <= 0) throw new Error('Некорректная цена товара')

      // 🔥 Безопасное получение WebApp API внутри функции (защита от падения SSR)
      const tgWebApp = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined

      // 🔥 Корректно подготавливаем body под наш бэкенд
      const requestBody: any = { userId, itemSku }

      // Если категория "энергия", передаем числовое количество для бэкенда
      if (itemCategory === 'energy') {
        requestBody.amount = Number(itemEffectValue)
      }

      // 🔥 Отправляем запрос на создание инвойса
      const response = await fetch('/api/payments/buy-stars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа')
      }

      if (!data.invoiceLink) {
        throw new Error('Ссылка на оплату не получена')
      }

      // 🔥 Нативное открытие инвойса внутри Telegram WebApp
      if (typeof window !== 'undefined' && tgWebApp?.openInvoice) {
        tgWebApp.openInvoice(data.invoiceLink, (status: string) => {
          console.log('⚡ Telegram Invoice status:', status)
          if (status === 'paid') {
            onSuccess?.()
            startPaymentStatusCheck(data.orderId || data.payload)
          } else if (status === 'cancelled') {
            setIsLoading(false)
            setError('Платеж отменен')
          } else {
            setIsLoading(false)
            setError('Ошибка проведения платежа внутри Telegram')
          }
        })
      } else {
        // Фолбек для тестирования в обычном браузере вне Telegram
        window.location.href = data.invoiceLink
        startPaymentStatusCheck(data.orderId || data.payload)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ошибка при покупке'
      console.error('❌ Purchase error:', error)
      setError(errorMessage)
      if (onError) onError(errorMessage)
      else alert(`❌ ${errorMessage}`)
      setIsLoading(false)
    }
  }

  // Опрос статуса по ID заказа из Prisma
  const startPaymentStatusCheck = (orderId: string) => {
    if (!orderId) return

    let attempts = 0
    const maxAttempts = 30 // 30 попыток * 3 секунды = 1.5 минуты опроса

    const intervalId = setInterval(async () => {
      attempts++

      try {
        const response = await fetch(
          `/api/payments/check-status?orderId=${orderId}&userId=${userId}`,
        )
        const data = await response.json()

        if (
          data.success &&
          (data.status === 'SUCCESS' || data.status === 'COMPLETED')
        ) {
          clearInterval(intervalId)
          console.log('✅ Payment confirmed in DB!')
          onSuccess?.()
          alert('✅ Покупка успешно зачислена!')
          window.location.reload()
        }

        if (data.status === 'FAILED' || data.status === 'REFUNDED') {
          clearInterval(intervalId)
          setError('Платеж отклонен СУБД')
          setIsLoading(false)
        }

        if (attempts >= maxAttempts) {
          clearInterval(intervalId)
          setIsLoading(false)
          if (onError)
            onError(
              'Время ожидания зачисления заказа истекло. Если баланс не обновился, обратитесь в поддержку.',
            )
        }
      } catch (error) {
        console.error('❌ Status check error:', error)
        if (attempts >= maxAttempts) {
          clearInterval(intervalId)
          setIsLoading(false)
        }
      }
    }, 3000)
  }

  return (
    <button
      onClick={handlePurchase}
      disabled={disabled || isLoading}
      className={`${className} disabled:opacity-50 relative overflow-hidden`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          Обработка...
        </span>
      ) : error ? (
        <span className="flex items-center justify-center gap-2 text-red-200">
          ⚠️ Ошибка
        </span>
      ) : (
        children || `Купить за ⭐ ${itemPriceStars}`
      )}
    </button>
  )
}
