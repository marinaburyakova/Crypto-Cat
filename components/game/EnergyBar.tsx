// components/game/EnergyBar.tsx
'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnergyBarProps {
  current: number;
  max: number;
  className?: string;
}

export function EnergyBar({ current, max, className }: EnergyBarProps) {
  const [isLow, setIsLow] = useState(false);
  const percentage = Math.min((current / max) * 100, 100);
  const isFull = percentage >= 100;

  useEffect(() => {
    setIsLow(percentage < 20 && percentage > 0);
  }, [percentage]);

  const getBarColor = () => {
    if (isFull) return 'from-emerald-500 to-emerald-400';
    if (percentage > 50) return 'from-cyan-500 to-blue-400';
    if (percentage > 20) return 'from-amber-500 to-yellow-400';
    return 'from-red-500 to-red-400';
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Zap className={cn(
            "w-4 h-4",
            isFull ? "text-emerald-400" : isLow ? "text-red-400 animate-pulse" : "text-cyan-400"
          )} />
          <span className="text-xs font-bold text-slate-300">
            Энергия
          </span>
        </div>
        <span className={cn(
          "text-xs font-mono font-bold",
          isFull ? "text-emerald-400" : isLow ? "text-red-400" : "text-cyan-400"
        )}>
          {current} / {max}
        </span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800/80 border border-slate-700/50">
        <div
          className={cn(
            "h-full w-full flex-1 bg-gradient-to-r transition-all duration-500 ease-out",
            getBarColor(),
            isFull && "animate-pulse",
            isLow && "animate-pulse"
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
        {/* Эффект свечения */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent",
          "animate-shimmer"
        )} style={{ transform: 'skewX(-45deg)' }} />
      </div>
    </div>
  );
}