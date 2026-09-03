// hooks/useTelegram.ts
'use client';

import { useState, useEffect } from 'react';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

// Типы для Haptic Feedback
export type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type NotificationType = 'error' | 'success' | 'warning';

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkTelegram = () => {
      if (typeof window === 'undefined') return;

      const webApp = window.Telegram?.WebApp;
      const isTelegram = !!(webApp?.initData || 
                          window.location.search.includes('tgWebAppData'));

      setIsInTelegram(isTelegram);

      if (isTelegram && webApp) {
        webApp.ready();
        webApp.expand();

        const userData = webApp.initDataUnsafe?.user;
        if (userData) {
          setUser(userData);
        }

        setIsReady(true);
      } else {
        setIsReady(true);
      }
    };

    checkTelegram();
  }, []);

  const showAlert = (message: string, callback?: () => void) => {
    if (isInTelegram && window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert(message, callback);
    } else {
      alert(message);
      callback?.();
    }
  };

  const showConfirm = (message: string, callback?: (confirmed: boolean) => void) => {
    if (isInTelegram && window.Telegram?.WebApp) {
      window.Telegram.WebApp.showConfirm(message, callback);
    } else {
      const confirmed = confirm(message);
      callback?.(confirmed);
    }
  };

  // Haptic Feedback для тактильной отдачи
  const hapticFeedback = (style: HapticStyle = 'medium') => {
    if (isInTelegram && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  };

  // Уведомление с вибрацией (для success/error/warning)
  const notificationFeedback = (type: NotificationType = 'success') => {
    if (isInTelegram && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
    }
  };

  const openLink = (url: string) => {
    if (isInTelegram && window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url);
    } else if (isInTelegram && window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return {
    user,
    isInTelegram,
    isReady,
    showAlert,
    showConfirm,
    hapticFeedback,
    notificationFeedback, // Добавлен новый метод
    openLink,
    webApp: typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined,
  };
}