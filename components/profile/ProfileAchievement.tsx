// components/profile/ProfileAchievement.tsx
'use client';

import { Award, Crown, Sparkles } from 'lucide-react';

interface ProfileAchievementProps {
  userData: {
    points: number;
    skin: string;
  };
}

export function ProfileAchievement({ userData }: ProfileAchievementProps) {
  const isSuperhero = userData.points >= 50;
  const isLegendary = userData.points >= 1000;

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-4 text-center">
      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center justify-center gap-2">
        <Award className="w-4 h-4" /> Airdrop Статус
      </h4>
      <p className="text-xs text-slate-400 mt-1">
        {isLegendary 
          ? '👑 Легендарный статус! Вы претендент на максимальный дроп!'
          : isSuperhero
          ? '🦸‍♂️ Супер-статус! Продолжайте копить ядра для дропа!'
          : '⚡ Копите 50+ ядер для активации супер-статуса!'
        }
      </p>
      <div className="mt-3 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5 text-xs">
          <span className={isSuperhero ? 'text-amber-400' : 'text-slate-600'}>
            {isSuperhero ? '⭐' : '☆'}
          </span>
          <span className={isSuperhero ? 'text-amber-400' : 'text-slate-500'}>
            Супер
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={isLegendary ? 'text-yellow-400' : 'text-slate-600'}>
            {isLegendary ? '👑' : '♛'}
          </span>
          <span className={isLegendary ? 'text-yellow-400' : 'text-slate-500'}>
            Легенда
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={userData.skin === 'legendary' ? 'text-red-400' : 'text-slate-600'}>
            {userData.skin === 'legendary' ? '🔥' : '◇'}
          </span>
          <span className={userData.skin === 'legendary' ? 'text-red-400' : 'text-slate-500'}>
            Скин
          </span>
        </div>
      </div>
    </div>
  );
}