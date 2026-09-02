// app/profile/page.tsx
import { prisma } from '@lib/prisma';
import { BottomNav } from '@/components/ui/bottom-nav';
import { User, ShieldAlert, Award, Calendar } from 'lucide-react';

export const revalidate = 0; // Отключаем кэширование, чтобы статистика всегда была свежей

export default async function ProfilePage() {
  const activeUserId = "guest_user_demo_1337";

  // Подтягиваем данные из PostgreSQL через Prisma 7
  const dbUser = await prisma.user.findUnique({
    where: { id: activeUserId }
  });

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-950 text-slate-50 overflow-hidden justify-between">
      <header className="p-4 bg-slate-900/70 border-b border-slate-800 backdrop-blur-md">
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-400" /> ПРОФИЛЬ КИБЕР-ТАПЕРА
        </h1>
        <p className="text-[11px] text-slate-400 mt-0.5">Ваши on-chain достижения и статистика</p>
      </header>

      {/* Блок статистики */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-none">
        
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 space-y-3.5 shadow-inner">
          <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
            <span className="text-xs text-slate-400 flex items-center gap-1.5"><Award className="w-4 h-4 text-yellow-500" /> Всего накликано:</span>
            <span className="text-sm font-mono font-black text-amber-400">
              {dbUser ? Number(dbUser.points).toLocaleString() : 0} ⚡
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
            <span className="text-xs text-slate-400 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-purple-400" /> RPG Уровень кота:</span>
            <span className="text-sm font-mono font-black text-purple-400">
              {dbUser ? dbUser.level : 1} LVL
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
            <span className="text-xs text-slate-400 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-cyan-400" /> Регистрация:</span>
            <span className="text-xs font-mono text-slate-300">
              {dbUser ? new Date(dbUser.createdAt).toLocaleDateString('ru-RU') : 'Сегодня'}
            </span>
          </div>
        </div>

        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-center space-y-1">
          <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider">Airdrop Статус</h4>
          <p className="text-xs text-slate-400">Снимок сети (Snapshot) еще не сделан. Продолжайте копить ядра для максимизации дропа токенов!</p>
        </div>

      </div>

      <div className="w-full z-30">
        <BottomNav activeTab="profile" />
      </div>
    </div>
  );
}
