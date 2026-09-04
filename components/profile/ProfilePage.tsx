// components/profile/ProfilePage.tsx
'use client';

import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { useNotification } from '@/components/ui/Notification';
import { ProfileHeader } from './ProfileHeader';
import { ProfileStats } from './ProfileStats';
import { ProfileAchievement } from './ProfileAchievement';
import { Loader2 } from 'lucide-react';

interface UserData {
  id: string;
  points: number;
  energy: number;
  maxEnergy: number;
  level: number;
  exp: number;
  passiveRate: number;
  unclaimedPoints: number;
  skin: string;
  vipUntil: string | null;
  totalSpent: number;
  createdAt: string;
}

export function ProfilePage() {
  const { showNotification, NotificationComponent } = useNotification();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userId = 'guest_user_demo_1337';

  useEffect(() => {
    fetch(`/api/clicks?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
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
          createdAt: data.createdAt || new Date().toISOString(),
        });
        setIsLoading(false);
      })
      .catch(() => {
        showNotification('error', '❌ Ошибка загрузки профиля');
        setIsLoading(false);
      });
  }, [userId, showNotification]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-950">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-950">
        <p className="text-slate-400">Не удалось загрузить профиль</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {NotificationComponent}

      <ProfileHeader userData={userData} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ProfileStats userData={userData} />
        <ProfileAchievement userData={userData} />
      </div>

      <BottomNav activeTab="profile" />
    </div>
  );
}