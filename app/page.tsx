// app/page.tsx
'use client'
import { GameUI } from '@/components/game/GameUI';

export default function HomePage() {
  const userId = 'guest_user_demo_1337';

  return (
    <div className="relative flex flex-col h-full w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <GameUI userId={userId} />
    </div>
  );
}