// components/game/TonPaymentModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface TonModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  itemPriceTon: string;
  itemSku: string;
  itemName: string;
  onSuccess?: () => void; // ✅ Добавлено
}

export function TonPaymentModal({ 
  userId,
  isOpen,
  onClose,
  itemPriceTon,
  itemSku,
  itemName,
  onSuccess
}: TonModalProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setTransactionId(null);
    }
  }, [isOpen]);

  const handlePayment = async () => {
    setStatus('processing');
    
    try {
      // Создаем платеж
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseFloat(itemPriceTon),
          price: itemPriceTon,
          type: 'ton',
          itemSku,
          itemName,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setTransactionId(data.transactionId);

      // В реальном проекте здесь будет открытие TON кошелька
      // Для демо: имитируем успешную оплату
      setTimeout(() => {
        setStatus('success');
        onSuccess?.();
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-2">
          💎 Оплата TON
        </h3>
        
        <p className="text-sm text-slate-400 mb-4">
          {itemName} — <span className="text-amber-400 font-bold">{itemPriceTon} TON</span>
        </p>

        {status === 'idle' && (
          <button
            onClick={handlePayment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>₿</span> Оплатить {itemPriceTon} TON
          </button>
        )}

        {status === 'processing' && (
          <div className="text-center py-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Обработка платежа...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-sm text-green-400 font-bold">✅ Платеж успешен!</p>
            <p className="text-xs text-slate-400 mt-1">Товар применен к вашему аккаунту</p>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl transition-colors"
            >
              Закрыть
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-4">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-400 font-bold">❌ Ошибка платежа</p>
            <p className="text-xs text-slate-400 mt-1">Попробуйте позже</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}
      </div>
    </div>
  );
}