// components/shop/ShopHeader.tsx
'use client';

import { Sparkles, Crown, Zap, Loader2 } from 'lucide-react';
import { ShopHeaderProps } from '@/types/shop'


export function ShopHeader({ userData, isRefreshing, onRefresh }: ShopHeaderProps) {
  const isVip = userData?.vipUntil && new Date(userData.vipUntil) > new Date();

  return (
    <header className="relative z-10 p-4 bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-xl border-b border-slate-800/80">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            КИБЕР-МАГАЗИН
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Улучшайте своего питомца 🚀
          </p>
        </div>
        
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl hover:bg-slate-800/50 transition-all duration-300 disabled:opacity-50"
        >
          <Loader2 className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Статистика пользователя */}
      {userData && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs bg-slate-800/30 rounded-xl p-2.5 border border-slate-700/30">
          <span className="text-slate-400">💰</span>
          <span className="text-amber-400 font-bold">{userData.points.toLocaleString()} ⚡</span>
          
          <span className="w-px h-4 bg-slate-700/50" />
          
          <span className="text-slate-400">🏆</span>
          <span className="text-purple-400 font-bold">{userData.level} LVL</span>
          
          <span className="w-px h-4 bg-slate-700/50" />
          
          <span className="text-slate-400">⚡</span>
          <span className="text-cyan-400 font-bold">{userData.energy}/{userData.maxEnergy}</span>
          
          {isVip && (
            <>
              <span className="w-px h-4 bg-slate-700/50" />
              <span className="text-amber-400 flex items-center gap-1">
                <Crown className="w-3 h-3" />
                VIP
              </span>
            </>
          )}
        </div>
      )}
    </header>
  );
}