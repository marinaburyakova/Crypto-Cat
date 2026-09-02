// components/ui/bottom-nav.tsx
'use client';

import Link from 'next/link';
import { Gamepad2, ShoppingBag, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'game' | 'shop' | 'profile';
}

export function BottomNav({ activeTab }: BottomNavProps) {
  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 px-6 py-2 flex justify-between items-center z-40">
      <Link href="/" className="flex flex-col items-center gap-1 flex-1 cursor-pointer">
        <Gamepad2 className={`w-5 h-5 transition-colors ${activeTab === 'game' ? 'text-purple-400' : 'text-slate-400'}`} />
        <span className={`text-[10px] font-bold ${activeTab === 'game' ? 'text-purple-400' : 'text-slate-400'}`}>Игра</span>
      </Link>

      <Link href="/shop" className="flex flex-col items-center gap-1 flex-1 cursor-pointer">
        <ShoppingBag className={`w-5 h-5 transition-colors ${activeTab === 'shop' ? 'text-purple-400' : 'text-slate-400'}`} />
        <span className={`text-[10px] font-bold ${activeTab === 'shop' ? 'text-purple-400' : 'text-slate-400'}`}>Магазин</span>
      </Link>

      <Link href="/profile" className="flex flex-col items-center gap-1 flex-1 cursor-pointer">
        <User className={`w-5 h-5 transition-colors ${activeTab === 'profile' ? 'text-purple-400' : 'text-slate-400'}`} />
        <span className={`text-[10px] font-bold ${activeTab === 'profile' ? 'text-purple-400' : 'text-slate-400'}`}>Профиль</span>
      </Link>
    </div>
  );
}
