// components/game/StarsPaymentButton.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StarsPaymentButtonProps {
  amount: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        showAlert: (message: string) => void;
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
        close: () => void;
        expand: () => void;
        ready: () => void;
        [key: string]: any;
      };
    };
  }
}

export function StarsPaymentButton({
  amount,
  onSuccess,
  onError,
  disabled = false,
  children
}: StarsPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const checkTelegramEnv = () => {
      const isTG = typeof window !== 'undefined' && 
                   window.Telegram?.WebApp !== undefined;
      
      setIsTelegramEnv(isTG);
      
      if (isTG) {
        console.log('✅ Telegram WebApp detected');
        try {
          window.Telegram?.WebApp?.expand();
          window.Telegram?.WebApp?.ready();
        } catch (error) {
          console.warn('⚠️ Could not expand Telegram WebApp:', error);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.info('📱 Not in Telegram environment - using demo mode');
          toast.info('Режим разработки: покупка звезд симулируется', {
            duration: 3000,
          });
        }
      }
    };

    checkTelegramEnv();
  }, []);

  const handlePayment = async () => {
    if (isProcessing || isLoading || disabled) {
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Некорректная сумма для оплаты');
      return;
    }

    setIsProcessing(true);
    setIsLoading(true);

    try {
      if (isTelegramEnv && window.Telegram?.WebApp) {
        console.log(`🚀 Starting payment with ${amount} stars`);
        
        try {
          // Создаем инвойс через вашу API
          const response = await fetch('/api/payment/create-invoice', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: amount,
              description: `Покупка ${amount} звезд`,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
          }

          const data = await response.json();
          
          if (!data.invoiceUrl) {
            throw new Error('Invoice URL not received');
          }

          console.log('📄 Opening invoice...');
          console.log('📄 Invoice URL:', data.invoiceUrl);
          
          // 🔥 ПРАВИЛЬНЫЙ ВЫЗОВ openInvoice
          // В зависимости от версии Telegram WebApp, openInvoice может принимать:
          // 1. Только URL: openInvoice(url)
          // 2. URL и callback: openInvoice(url, callback)
          
          // Пробуем первый вариант (без callback)
          try {
            // Вариант 1: Без callback
            window.Telegram.WebApp.openInvoice(data.invoiceUrl);
            
            // В этом случае мы не можем отследить статус оплаты,
            // поэтому используем таймаут для снятия блокировки
            setTimeout(() => {
              setIsProcessing(false);
              setIsLoading(false);
            }, 5000);
            
            // Показываем информационное сообщение
            toast.info('⏳ Оплата в обработке. Проверьте Telegram...');
            
            // Предполагаем успех (пользователь сам подтвердит через бота)
            // Но вызываем onSuccess только если есть подтверждение с сервера
            // Можно добавить вебхук для подтверждения
            
          } catch (invoiceError) {
            console.warn('⚠️ openInvoice without callback failed, trying with callback...', invoiceError);
            
            // Вариант 2: С callback (если поддерживается)
            try {
              window.Telegram.WebApp.openInvoice(data.invoiceUrl, (status: string) => {
                console.log('💰 Invoice status:', status);
                
                switch (status) {
                  case 'paid':
                    toast.success(`🎉 Оплата успешна! ${amount} звезд добавлено`);
                    onSuccess?.();
                    break;
                    
                  case 'cancelled':
                    toast.info('❌ Оплата отменена');
                    break;
                    
                  case 'failed':
                    toast.error('❌ Оплата не удалась. Попробуйте позже');
                    onError?.(new Error('Payment failed'));
                    break;
                    
                  case 'pending':
                    toast.info('⏳ Оплата в обработке...');
                    break;
                    
                  default:
                    console.warn('Unknown invoice status:', status);
                    toast.info(`Статус оплаты: ${status}`);
                }
                
                setIsProcessing(false);
                setIsLoading(false);
              });
            } catch (callbackError) {
              console.error('❌ Both openInvoice methods failed:', callbackError);
              throw new Error('Failed to open invoice');
            }
          }
          
        } catch (error) {
          console.error('Payment error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
          toast.error(`Ошибка оплаты: ${errorMessage}`);
          onError?.(error instanceof Error ? error : new Error(errorMessage));
          setIsProcessing(false);
          setIsLoading(false);
        }
      } else {
        // 💡 Режим разработки / демо
        console.log('🎮 Demo mode: simulating stars purchase', amount);
        
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success(`⭐ ${amount} звезд добавлено (демо-режим)`);
        console.log(`✅ Demo: Added ${amount} stars`);
        
        onSuccess?.();
        
        try {
          const currentStars = parseInt(localStorage.getItem('demoStars') || '0');
          const newStars = currentStars + amount;
          localStorage.setItem('demoStars', String(newStars));
          console.log(`📊 Demo stars: ${currentStars} → ${newStars}`);
        } catch (storageError) {
          console.warn('Could not save to localStorage:', storageError);
        }
        
        setIsProcessing(false);
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('Payment handler error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast.error(`Произошла ошибка: ${errorMessage}`);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      setIsProcessing(false);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading || isProcessing}
      className="w-full relative overflow-hidden transition-all duration-200"
      variant={isTelegramEnv ? "default" : "outline"} size={''}    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Обработка...
        </span>
      ) : (
        children || (
          <span className="flex items-center gap-2">
            ⭐ Купить {amount} звезд
          </span>
        )
      )}
      
      {!isTelegramEnv && process.env.NODE_ENV === 'development' && (
        <span className="absolute top-0 right-0 text-[8px] bg-yellow-500/20 px-1.5 py-0.5 rounded-bl text-yellow-700 dark:text-yellow-300">
          DEMO
        </span>
      )}
    </Button>
  );
}