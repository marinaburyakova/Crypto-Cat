// components/profile/ProfileHeader.tsx
'use client';

import { User, Crown } from 'lucide-react';

interface ProfileHeaderProps {
  userData: {
    level: number;
    points: number;
    vipUntil: string | null;
  };
}

export function ProfileHeader({ userData }: ProfileHeaderProps) {
  const isVip = userData.vipUntil && new Date(userData.vipUntil) > new Date();

  return (
    <header className="relative z-10 p-4 bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-xl border-b border-slate-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Профиль
              {isVip && <Crown className="w-4 h-4 text-yellow-400" />}
            </h1>
            <p className="text-xs text-slate-400">Уровень {userData.level}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-slate-400">Баланс</p>
          <p className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {userData.points.toLocaleString()} ⚡
          </p>
        </div>
      </div>
    </header>
  );
}