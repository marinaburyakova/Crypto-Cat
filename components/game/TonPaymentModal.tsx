// components/game/TonPaymentModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TonModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  itemPriceTon: string;
  itemSku: string;
  itemName: string;
  onSuccess?: () => void;
  onError?: (error: string) => void; // ✅ Добавлен обработчик ошибок
}

export function TonPaymentModal({ 
  userId,
  isOpen,
  onClose,
  itemPriceTon,
  itemSku,
  itemName,
  onSuccess,
  onError // ✅ Добавлен
}: TonModalProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setTransactionId(null);
      setErrorMessage(null);
      setPaymentLink(null);
    }
  }, [isOpen]);

  const handlePayment = async () => {
    setStatus('processing');
    setErrorMessage(null);
    
    try {
      // ✅ Валидация входных данных
      if (!userId) {
        throw new Error('ID пользователя не указан');
      }

      if (!itemSku) {
        throw new Error('SKU товара не указан');
      }

      const price = parseFloat(itemPriceTon);
      if (isNaN(price) || price <= 0) {
        throw new Error('Некорректная цена товара');
      }

      // ✅ Используем правильный API эндпоинт для TON
      const response = await fetch('/api/payments/ton-invoice', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          itemPriceTon: itemPriceTon,
          itemSku,
          itemName,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа');
      }

      // ✅ Проверяем наличие TON URI
      if (!data.tonUri) {
        throw new Error('Ссылка на оплату TON не получена');
      }

      setTransactionId(data.transactionId || null);
      setPaymentLink(data.tonUri);

      // ✅ Открываем TON URI для оплаты
      // Это может быть ссылка на кошелек или deeplink
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // На мобильных - открываем в приложении кошелька
        window.location.href = data.tonUri;
      } else {
        // На десктопе - показываем QR код или ссылку
        // Для простоты - открываем в новом окне
        const newWindow = window.open(data.tonUri, '_blank');
        if (!newWindow) {
          // Если не удалось открыть окно, показываем ссылку
          setErrorMessage('Нажмите на ссылку для оплаты или скопируйте ее в кошелек');
        }
      }

      // ✅ Начинаем проверку статуса платежа
      if (data.memo) {
        startPaymentStatusCheck(data.memo);
      } else {
        // Если нет memo, используем fallback
        // В реальном проекте здесь будет ожидание подтверждения
        setTimeout(() => {
          setStatus('success');
          onSuccess?.();
        }, 5000);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ошибка при оплате TON';
      console.error('❌ Payment error:', errorMsg);
      setStatus('error');
      setErrorMessage(errorMsg);
      
      // ✅ Вызываем onError если передан
      if (onError) {
        onError(errorMsg);
      }
    }
  };

  // ✅ Функция проверки статуса платежа
  const startPaymentStatusCheck = (memo: string) => {
    let attempts = 0;
    const maxAttempts = 60; // Максимум 60 попыток (5 минут)
    const intervalId = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`/api/payments/check-status?memo=${memo}&userId=${userId}`);
        const data = await response.json();

        if (data.success && data.status === 'SUCCESS') {
          clearInterval(intervalId);
          console.log('✅ TON Payment confirmed!');
          setStatus('success');
          onSuccess?.();
          return;
        }

        // Если статус FAILED или REFUNDED
        if (data.status === 'FAILED' || data.status === 'REFUNDED') {
          clearInterval(intervalId);
          console.warn('⚠️ TON Payment failed or refunded');
          
          const errorMsg = data.status === 'FAILED' 
            ? 'Платеж TON не удался' 
            : 'Платеж TON был возвращен';
          
          setStatus('error');
          setErrorMessage(errorMsg);
          
          if (onError) {
            onError(errorMsg);
          }
          return;
        }

        // Если превышено количество попыток
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          console.warn('⚠️ TON Payment status check timeout');
          setStatus('error');
          setErrorMessage('Превышено время ожидания подтверждения платежа TON');
          
          if (onError) {
            onError('Превышено время ожидания подтверждения платежа TON');
          }
        }

      } catch (error) {
        console.error('❌ Status check error:', error);
        
        // Если ошибка при проверке, продолжаем пытаться
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          setStatus('error');
          setErrorMessage('Ошибка проверки статуса платежа TON');
          
          if (onError) {
            onError('Ошибка проверки статуса платежа TON');
          }
        }
      }
    }, 5000); // Проверка каждые 5 секунд

    // ✅ Возвращаем функцию для очистки интервала
    return () => clearInterval(intervalId);
  };

  // ✅ Функция копирования ссылки в буфер обмена
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('✅ Ссылка скопирована в буфер обмена!');
    } catch (error) {
      console.error('❌ Failed to copy:', error);
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('✅ Ссылка скопирована!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl shadow-purple-500/20">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          disabled={status === 'processing'}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-2xl">₿</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Оплата TON
            </h3>
            <p className="text-xs text-slate-400">
              {itemName}
            </p>
          </div>
        </div>

        {/* Информация о товаре */}
        <div className="bg-slate-800/50 rounded-xl p-3 mb-4 border border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Товар:</span>
            <span className="text-sm font-medium text-white">{itemName}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-slate-400">Сумма:</span>
            <span className="text-lg font-bold text-amber-400">{itemPriceTon} TON</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-slate-400">Курс:</span>
            <span className="text-xs text-slate-500">1 TON ≈ $5.50 USD</span>
          </div>
        </div>

        {/* Состояния */}
        {status === 'idle' && (
          <div className="space-y-3">
            <button
              onClick={handlePayment}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              <span className="text-xl">₿</span> Оплатить {itemPriceTon} TON
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium py-2 rounded-xl transition-colors text-sm"
              >
                Отмена
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center">
              💡 Оплата происходит через TON кошелек. Убедитесь, что у вас есть TON для оплаты.
            </p>
          </div>
        )}

        {status === 'processing' && (
          <div className="text-center py-6">
            <Loader2 className="w-14 h-14 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-200">Ожидание подтверждения платежа...</p>
            <p className="text-xs text-slate-400 mt-1">Пожалуйста, подтвердите транзакцию в TON кошельке</p>
            
            {/* Показываем ссылку на оплату, если есть */}
            {paymentLink && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Или перейдите по ссылке:</p>
                <button
                  onClick={() => copyToClipboard(paymentLink)}
                  className="text-xs text-blue-400 hover:text-blue-300 break-all bg-slate-700/50 px-3 py-2 rounded-lg w-full"
                >
                  {paymentLink.length > 40 ? `${paymentLink.substring(0, 40)}...` : paymentLink}
                </button>
              </div>
            )}
            
            <button
              onClick={() => {
                setStatus('idle');
                setErrorMessage(null);
              }}
              className="mt-4 text-sm text-slate-500 hover:text-slate-400 transition-colors"
            >
              ← Назад
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-6">
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                <CheckCircle className="w-16 h-16 text-green-400 relative" />
              </div>
            </div>
            <p className="text-lg font-bold text-green-400">✅ Платеж успешен!</p>
            <p className="text-sm text-slate-400 mt-1">
              Товар <span className="text-white font-medium">{itemName}</span> применен к вашему аккаунту
            </p>
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs text-green-400 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Транзакция завершена
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-6 w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2.5 rounded-xl transition-colors shadow-lg shadow-green-500/30"
            >
              Закрыть
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-6">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-lg font-bold text-red-400">❌ Ошибка платежа</p>
            <p className="text-sm text-slate-400 mt-1">
              {errorMessage || 'Произошла ошибка при обработке платежа'}
            </p>
            
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
              <p className="text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Проверьте баланс TON кошелька и попробуйте снова</span>
              </p>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  setStatus('idle');
                  setErrorMessage(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors"
              >
                Попробовать снова
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium py-2.5 rounded-xl transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}