// components/game/StarsPaymentButton.tsx
'use client';

import { useState } from 'react';

interface StarsPaymentButtonProps {
  userId: string;
  itemPriceStars: number;
  itemSku: string;
  itemName: string;
  onSuccess?: () => void;
  className?: string; // ✅ Добавлено
}

export function StarsPaymentButton({ 
  userId, 
  itemPriceStars, 
  itemSku, 
  itemName, 
  onSuccess,
  className = ''
}: StarsPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: itemPriceStars,
          price: itemPriceStars,
          type: 'stars',
          itemSku,
          itemName,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      onSuccess?.();
      
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Ошибка при покупке. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={isLoading}
      className={`flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-xl shadow-md transition-all active:scale-95 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          Обработка...
        </span>
      ) : (
        <span>⭐ {itemPriceStars} Stars</span>
      )}
    </button>
  );
}