// components/profile/ProfileStats.tsx
'use client';

import { Zap, Award, TrendingUp, Clock, Calendar } from 'lucide-react';

interface ProfileStatsProps {
  userData: {
    points: number;
    energy: number;
    maxEnergy: number;
    level: number;
    exp: number;
    passiveRate: number;
    unclaimedPoints: number;
    totalSpent: number;
    createdAt: string;
  };
}

export function ProfileStats({ userData }: ProfileStatsProps) {
  const daysInGame = Math.floor(
    (Date.now() - new Date(userData.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const nextLevelExp = userData.level * 500;
  const progressToNextLevel = Math.min(100, (userData.exp / nextLevelExp) * 100);
  const totalClicks = Math.floor(userData.points / 10);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-4 space-y-3">
        <StatRow icon={Award} label="Всего накликано" value={`${userData.points.toLocaleString()} ⚡`} color="text-amber-400" />
        <StatRow icon={Zap} label="Энергия" value={`${userData.energy} / ${userData.maxEnergy}`} color="text-cyan-400" />
        <StatRow icon={Award} label="Нераспределенные" value={userData.unclaimedPoints.toLocaleString()} color="text-emerald-400" />
        <StatRow icon={TrendingUp} label="Пассивный доход" value={`${userData.passiveRate} ⚡/ч`} color="text-cyan-400" />
        
        <div className="border-t border-slate-800/50 pt-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Прогресс до LVL {userData.level + 1}</span>
            <span>{userData.exp} / {nextLevelExp} XP</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${progressToNextLevel}%` }}
            />
          </div>
        </div>

        <StatRow icon={Clock} label="Дней в игре" value={`${daysInGame} дн.`} color="text-cyan-400" />
        <StatRow icon={Calendar} label="Регистрация" value={new Date(userData.createdAt).toLocaleDateString('ru-RU')} color="text-slate-300" />
        
        <div className="border-t border-slate-800/50 pt-3">
          <StatRow icon={Award} label="Всего потрачено" value={`$${userData.totalSpent.toFixed(2)}`} color="text-amber-400" />
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="w-3 h-3" /> Статистика кликов
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">Всего кликов</p>
            <p className="text-lg font-bold text-amber-400">{totalClicks.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">Средний клик</p>
            <p className="text-lg font-bold text-cyan-400">10 ⚡</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-400 flex items-center gap-1.5">
        <Icon className={`w-4 h-4 ${color}`} />
        {label}:
      </span>
      <span className={`text-sm font-mono font-bold ${color}`}>
        {value}
      </span>
    </div>
  );
}