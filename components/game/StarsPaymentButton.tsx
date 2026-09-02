// components/game/StarsPaymentButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StarsPaymentButtonProps {
  amount?: number; // Знак вопроса делает свойство необязательным, исправляя TS2741
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  userId: string;
  itemPriceStars: number;
  itemSku: string;
  itemName: string;
}

// Блок declare global полностью УДАЛЕН, так как у вас уже есть рабочий types/telegram.d.ts (исправляет TS2717)

export function StarsPaymentButton({
  amount,
  onSuccess,
  onError,
  disabled = false,
  children,
  userId,
  itemPriceStars,
  itemSku,
  itemName,
}: StarsPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const finalAmount = itemPriceStars || amount || 0;

  useEffect(() => {
    const checkTelegramEnv = () => {
      // Безопасное чтение глобального объекта, который уже объявлен в вашем types/telegram.d.ts
      const isTG =
        typeof window !== 'undefined' && (window as any).Telegram?.WebApp !== undefined;

      setIsTelegramEnv(isTG);

      if (isTG) {
        console.log('✅ Telegram WebApp detected');
        try {
          (window as any).Telegram.WebApp.expand();
          (window as any).Telegram.WebApp.ready();
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

    if (!finalAmount || finalAmount <= 0) {
      toast.error('Некорректная сумма для оплаты');
      return;
    }

    setIsProcessing(true);
    setIsLoading(true);

    try {
      if (isTelegramEnv && (window as any).Telegram?.WebApp) {
        console.log(`🚀 Starting payment with ${finalAmount} stars`);

        try {
          const response = await fetch('/api/payments/stars-invoice', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              itemPriceStars: finalAmount,
              itemSku,
              itemName,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
          }

          const data = await response.json();
          const targetInvoiceLink = data.invoiceLink;

          if (!targetInvoiceLink) {
            throw new Error('Invoice Link not received');
          }

          console.log('📄 Opening invoice...');

          // Вызов openInvoice из вашего официального типа
          (window as any).Telegram.WebApp.openInvoice(
            targetInvoiceLink,
            (status: string) => {
              console.log('💰 Invoice status:', status);

              switch (status) {
                case 'paid':
                  toast.success(`🎉 Оплата успешна! ${finalAmount} звезд зачислено`);
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
            }
          );

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
          toast.error(`Ошибка оплаты: ${errorMessage}`);
          onError?.(error instanceof Error ? error : new Error(errorMessage));
          setIsProcessing(false);
          setIsLoading(false);
        }
      } else {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        toast.success(`⭐ ${finalAmount} звезд добавлено (демо-режим)`);
        onSuccess?.();

        try {
          const currentStars = parseInt(localStorage.getItem('demoStars') || '0');
          const newStars = currentStars + finalAmount;
          localStorage.setItem('demoStars', String(newStars));
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
      className="w-full relative overflow-hidden transition-all duration-200 cursor-pointer"
      variant={isTelegramEnv ? 'default' : 'outline'} size={''}    >
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
            ⭐ Купить за {finalAmount} звезд
          </span>
        )
      )}

      {!isTelegramEnv && process.env.NODE_ENV === 'development' && (
        <span className="absolute top-0 right-0 text-[8px] bg-yellow-500/20 px-1.5 py-0.5 rounded-bl text-yellow-700 dark:text-yellow-300 select-none">
          DEMO
        </span>
      )}
    </Button>
  );
}
