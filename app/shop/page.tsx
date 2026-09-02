// app/shop/page.tsx
'use client';

import { useState } from 'react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { TonPaymentModal } from '@/components/game/TonPaymentModal';
import { StarsPaymentButton } from '@/components/game/StarsPaymentButton';
import { Zap, Shield, Sparkles } from 'lucide-react';

export default function ShopPage() {
  const [isTonModalOpen, setIsTonModalOpen] = useState<boolean>(false);
  const activeUserId = "guest_user_demo_1337";

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-950 text-slate-50 overflow-hidden justify-between">
      <header className="p-4 bg-slate-900/70 border-b border-slate-800 backdrop-blur-md">
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> КИБЕР-МАГАЗИН
        </h1>
        <p className="text-[11px] text-slate-400 mt-0.5">Улучшайте своего питомца за STARS и TON</p>
      </header>

      {/* Список товаров магазина */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-none">
        
        {/* Товар 1: Покупка за TON */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-400 fill-blue-400" /> Бустер пассива x2
              </h3>
              <p className="text-xs text-slate-400 mt-1">Добавляет +50 Энергоядер в секунду к пассивному доходу кота навсегда.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsTonModalOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 text-xs cursor-pointer"
          >
            Купить за 0.5 TON
          </button>
        </div>

        {/* Товар 2: Покупка за Telegram Stars */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-400" /> Мгновенный Level Up
              </h3>
              <p className="text-xs text-slate-400 mt-1">Повышает текущий RPG уровень кота на +1 и разблокирует новые скины.</p>
            </div>
          </div>
          <StarsPaymentButton 
            userId={activeUserId}
            itemPriceStars={50} 
            itemSku="cat_level_up" 
            itemName="Повысить Уровень Кота" 
          />
        </div>

      </div>

      {/* Окно оплаты в TON */}
      <TonPaymentModal 
        userId={activeUserId}
        isOpen={isTonModalOpen}
        onClose={() => setIsTonModalOpen(false)}
        itemPriceTon="0.5"
        itemSku="boost_x2"
        itemName="Бустер пассивного дохода x2"
      />

      <div className="w-full z-30">
        <BottomNav activeTab="shop" />
      </div>
    </div>
  );
}
