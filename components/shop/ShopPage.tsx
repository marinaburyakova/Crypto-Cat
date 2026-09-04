// components/shop/ShopPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { ShopHeader } from './ShopHeader';
import { ShopItemCard } from './ShopItemCard';
import { TonPaymentModal } from '../game/TonPaymentModal';
import { useNotification } from '@/components/ui/Notification';
import { ShopItem, UserData } from '@/types/shop';
import { 
  Loader2, 
  AlertCircle, 
  Gift, 
  Zap, 
  TrendingUp, 
  Crown, 
  Sparkles, 
  Rocket 
} from 'lucide-react';


// ✅ Импортируем товары из отдельного файла или определяем здесь
const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'energy_boost',
    name: '⚡ Бустер энергии',
    description: '➕ Увеличивает максимальную энергию на 50',
    priceTon: '0.5',
    priceStars: 50,
    icon: Zap,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    borderColor: 'border-cyan-400/20',
    effect: 'energy_boost',
    effectValue: 50,
    popular: true,
    category: 'energy',
  },
  {
    id: 'energy_boost_big',
    name: '⚡ Большой бустер энергии',
    description: '➕ Увеличивает максимальную энергию на 200',
    priceTon: '1.5',
    priceStars: 150,
    icon: Zap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
    effect: 'energy_boost_big',
    effectValue: 200,
    popular: false,
    category: 'energy',
  },
  {
    id: 'level_up',
    name: '📈 Мгновенный Level Up',
    description: '⬆️ Повышает уровень кота на 1 + бонус 50 очков',
    priceTon: '1.0',
    priceStars: 100,
    icon: TrendingUp,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
    effect: 'level_up',
    effectValue: 1,
    popular: false,
    category: 'level',
  },
  {
    id: 'level_up_big',
    name: '📈 Мега Level Up',
    description: '⬆️ Повышает уровень кота на 3 + бонус 200 очков',
    priceTon: '2.5',
    priceStars: 250,
    icon: TrendingUp,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-400/10',
    borderColor: 'border-indigo-400/20',
    effect: 'level_up_big',
    effectValue: 3,
    popular: false,
    category: 'level',
  },
  {
    id: 'vip_status',
    name: '👑 VIP Статус (7 дней)',
    description: '✨ +100% к пассивному доходу на 7 дней',
    priceTon: '5.0',
    priceStars: 500,
    icon: Crown,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/20',
    effect: 'vip_status',
    effectValue: 7,
    popular: true,
    category: 'vip',
  },
  {
    id: 'legendary_skin',
    name: '🔥 Легендарный скин',
    description: '🎨 Уникальный скин кота + 100 очков',
    priceTon: '10.0',
    priceStars: 1000,
    icon: Sparkles,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    borderColor: 'border-red-400/20',
    effect: 'skin',
    effectValue: 'legendary',
    popular: false,
    category: 'skin',
  },
  {
    id: 'mega_pack',
    name: '🚀 Мега-пакет',
    description: '💎 Всё сразу: энергия + уровень + VIP + скин + 500 очков',
    priceTon: '25.0',
    priceStars: 2500,
    icon: Rocket,
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/10',
    borderColor: 'border-pink-400/20',
    effect: 'mega_pack',
    effectValue: 'all',
    popular: true,
    category: 'mega',
  },
];

export function ShopPage() {
  const { showNotification, NotificationComponent } = useNotification();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTonModalOpen, setIsTonModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  const userId = 'guest_user_demo_1337';

  const fetchUserData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      const res = await fetch(`/api/clicks?userId=${userId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      
      setUserData({
        id: userId,
        points: data.points || 0,
        energy: data.energy || 1000,
        maxEnergy: data.maxEnergy || 1000,
        level: data.level || 1,
        exp: data.exp || 0,
        passiveRate: data.passiveRate || 0,
        unclaimedPoints: data.unclaimedPoints || 0,
        skin: data.skin || 'default',
        vipUntil: data.vipUntil || null,
        totalSpent: data.totalSpent || 0,
      });
    } catch (error) {
      setError('Не удалось загрузить данные');
      showNotification('error', '❌ Ошибка загрузки магазина');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, showNotification]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // ✅ Исправлено: правильная типизация
  const handleBuyTon = useCallback((item: ShopItem) => {
    setSelectedItem(item);
    setIsTonModalOpen(true);
  }, []);

  const handleSuccess = useCallback(() => {
    showNotification('success', '✅ Покупка успешно завершена!');
    fetchUserData();
  }, [fetchUserData, showNotification]);

  const handleError = useCallback((error: string) => {
    showNotification('error', `❌ ${error}`);
  }, [showNotification]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Загрузка магазина...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {NotificationComponent}

      <ShopHeader
        userData={userData}
        isRefreshing={isRefreshing}
        onRefresh={fetchUserData}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-red-400 flex-1">{error}</p>
            <button 
              onClick={fetchUserData} 
              className="text-xs text-red-400 hover:text-red-300 underline"
            >
              Повторить
            </button>
          </div>
        )}

        <div className="space-y-3">
          {SHOP_ITEMS.map((item) => (
            <ShopItemCard
              key={item.id}
              item={item}
              userId={userId}
              onBuyTon={handleBuyTon}
              onSuccess={handleSuccess}
              onError={handleError}
              isRefreshing={isRefreshing}
              canAfford={true}
            />
          ))}
        </div>

        {/* Баннер */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
          <h4 className="text-xs font-black text-amber-400 flex items-center justify-center gap-2">
            <Gift className="w-4 h-4" />
            Специальное предложение
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Покупайте за TON и получайте{' '}
            <span className="text-amber-400 font-bold">+20%</span> бонусных очков!
          </p>
          {userData && userData.totalSpent > 0 && (
            <p className="text-[10px] text-slate-500 mt-2">
              Всего потрачено: ${userData.totalSpent.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {selectedItem && (
        <TonPaymentModal
          userId={userId}
          isOpen={isTonModalOpen}
          onClose={() => {
            setIsTonModalOpen(false);
            setSelectedItem(null);
          }}
          itemPriceTon={selectedItem.priceTon}
          itemSku={selectedItem.id}
          itemName={selectedItem.name}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}

      <BottomNav activeTab="shop" />
    </div>
  );
}