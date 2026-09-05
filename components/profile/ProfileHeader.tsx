// components/profile/ProfileHeader.tsx
'use client';

import { UserData } from './ProfilePage';

interface ProfileHeaderProps {
  userData: UserData;
  isGuest: boolean;  // ← Добавляем пропс
}

export function ProfileHeader({ userData, isGuest }: ProfileHeaderProps) {
  return (
    <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-purple-900/20 via-slate-900 to-slate-900 border-b border-zinc-800">
      <div className="flex items-center gap-4">
        {/* Аватар */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl shadow-lg shadow-purple-500/20">
            🐱
          </div>
          {isGuest && (
            <div className="absolute -bottom-1 -right-1 bg-zinc-800 border border-zinc-700 rounded-full px-2 py-0.5 text-[10px] text-slate-400">
              🟢 Гость
            </div>
          )}
        </div>

        {/* Информация */}
        <div>
          <h1 className="text-xl font-bold text-white">
            {userData.login || 'Игрок'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-400">
              Уровень {userData.level}
            </span>
            {!isGuest && (
              <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                ✓ Авторизован
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Статистика в шапке */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-zinc-800/50">
        <div className="text-center">
          <p className="text-lg font-bold text-yellow-400">{userData.points}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">⭐ Звёзды</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-400">{userData.energy}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">⚡ Энергия</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-purple-400">{userData.level}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">📊 Уровень</p>
        </div>
      </div>
    </div>
  );
}