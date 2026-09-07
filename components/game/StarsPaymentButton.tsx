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
  const [showFallbackMessage, setShowFallbackMessage] = useState<string | null>(
    null,
  )

  // ✅ Проверка поддержки openInvoice
  const isOpenInvoiceSupported = (tgWebApp: any): boolean => {
    if (!tgWebApp) return false

    // Проверяем наличие метода
    if (typeof tgWebApp.openInvoice !== 'function') return false

    // Проверяем версию WebApp (для Stars нужна 6.1+)
    const version = tgWebApp.version || '6.0'
    const [major, minor] = version.split('.').map(Number)
    return major > 6 || (major === 6 && minor >= 1)
  }

  // ✅ БЕЗОПАСНЫЙ показ сообщений - используем только alert или кастомный UI
  const showMessage = (message: string, isError: boolean = false) => {
    // Пытаемся использовать Telegram WebApp только для Haptic (безопасно)
    const tgWebApp =
      typeof window !== 'undefined'
        ? (window as any).Telegram?.WebApp
        : undefined

    // Пробуем использовать Haptic для вибрации (безопасно в 6.0)
    if (tgWebApp?.HapticFeedback?.notificationOccurred) {
      try {
        tgWebApp.HapticFeedback.notificationOccurred(
          isError ? 'error' : 'success',
        )
      } catch (e) {
        // Игнорируем ошибки Haptic
      }
    }

    // ✅ Используем обычный alert - он гарантированно работает везде
    // Для улучшения UX можно использовать кастомный UI
    alert(message)
  }

  // ✅ Показ через кастомный UI (если хотите красивый тост)
  const showCustomMessage = (message: string, isError: boolean = false) => {
    setShowFallbackMessage(message)
    setTimeout(() => setShowFallbackMessage(null), 3000)

    // Также дублируем в alert для надежности
    alert(message)
  }

  const handlePurchase = async () => {
    setError(null)
    setIsLoading(true)

    try {
      if (!userId) throw new Error('ID пользователя не указан')
      if (!itemSku) throw new Error('SKU товара не указан')
      if (itemPriceStars <= 0) throw new Error('Некорректная цена товара')

      // 🔥 Безопасное получение WebApp API внутри функции (защита от падения SSR)
      const tgWebApp =
        typeof window !== 'undefined'
          ? (window as any).Telegram?.WebApp
          : undefined

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

      // ✅ Проверяем поддержку openInvoice
      const isSupported = isOpenInvoiceSupported(tgWebApp)

      console.log(
        '📱 Telegram WebApp version:',
        tgWebApp?.version || 'not available',
      )
      console.log('📱 openInvoice supported:', isSupported)

      // 🔥 Открываем инвойс с проверкой поддержки
      if (typeof window !== 'undefined' && tgWebApp && isSupported) {
        // ✅ Современный метод - открываем внутри Telegram
        tgWebApp.openInvoice(data.invoiceLink, (status: string) => {
          console.log('⚡ Telegram Invoice status:', status)

          if (status === 'paid') {
            onSuccess?.()
            startPaymentStatusCheck(data.orderId || data.payload)
          } else if (status === 'cancelled') {
            setIsLoading(false)
            setError('Платеж отменен')
            showMessage('Платеж отменен')
          } else if (status === 'failed') {
            setIsLoading(false)
            setError('Платеж не прошел. Попробуйте позже.')
            showMessage('Платеж не прошел. Попробуйте позже.')
          } else {
            setIsLoading(false)
            setError('Ошибка проведения платежа')
            showMessage('Ошибка проведения платежа')
          }
        })
      } else {
        // ⚠️ Fallback для старых версий или обычного браузера

        // ✅ Используем безопасный показ сообщения
        showMessage(
          'Ваша версия Telegram не поддерживает оплату через Stars. ' +
            'Пожалуйста, обновите Telegram до последней версии или ' +
            'откройте ссылку в браузере.',
        )

        // Открываем в новой вкладке (работает везде)
        window.open(data.invoiceLink, '_blank')

        // Запускаем проверку статуса
        startPaymentStatusCheck(data.orderId || data.payload)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ошибка при покупке'
      console.error('❌ Purchase error:', error)
      setError(errorMessage)

      // ✅ Используем безопасный показ ошибки
      showMessage(`❌ ${errorMessage}`)

      if (onError) onError(errorMessage)
      setIsLoading(false)
    }
  }

  // ✅ Улучшенный опрос статуса
  const startPaymentStatusCheck = (orderId: string) => {
    if (!orderId) return

    let attempts = 0
    const maxAttempts = 30
    let intervalId: NodeJS.Timeout | null = null

    const checkStatus = async () => {
      attempts++

      try {
        const response = await fetch(
          `/api/payments/check-status?orderId=${orderId}&userId=${userId}`,
        )
        const data = await response.json()

        if (response.status === 404) {
          console.log('⏳ Transaction not found yet, waiting...')
          return
        }

        if (!response.ok) {
          console.error('❌ Status check failed:', data.error)
          return
        }

        if (
          data.success &&
          (data.status === 'SUCCESS' || data.status === 'COMPLETED')
        ) {
          if (intervalId) clearInterval(intervalId)
          console.log('✅ Payment confirmed in DB!')
          onSuccess?.()

          showMessage('✅ Покупка успешно зачислена!')
          window.location.reload()
        }

        if (data.status === 'FAILED' || data.status === 'REFUNDED') {
          if (intervalId) clearInterval(intervalId)
          setError('Платеж отклонен')
          setIsLoading(false)
          showMessage('❌ Платеж был отклонен. Попробуйте снова.')
        }

        if (attempts >= maxAttempts) {
          if (intervalId) clearInterval(intervalId)
          setIsLoading(false)
          const errorMsg =
            'Время ожидания зачисления истекло. Если баланс не обновился, обратитесь в поддержку.'
          setError(errorMsg)
          if (onError) onError(errorMsg)
          showMessage(errorMsg)
        }
      } catch (error) {
        console.error('❌ Status check error:', error)
        if (attempts >= maxAttempts) {
          if (intervalId) clearInterval(intervalId)
          setIsLoading(false)
        }
      }
    }

    intervalId = setInterval(checkStatus, 3000)
    setTimeout(checkStatus, 500)
  }

  return (
    <>
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
            ⚠️ {error}
          </span>
        ) : (
          children || `Купить за ⭐ ${itemPriceStars}`
        )}
      </button>

      {/* ✅ Кастомное уведомление (опционально) */}
      {showFallbackMessage && (
        <div className="fixed bottom-4 left-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 animate-fade-in">
          {showFallbackMessage}
        </div>
      )}
    </>
  )
}
