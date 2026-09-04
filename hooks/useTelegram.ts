// hooks/useTelegram.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

// Типы для Haptic Feedback
export type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type NotificationType = 'error' | 'success' | 'warning';

interface UseTelegramReturn {
  user: TelegramUser | null;
  isInTelegram: boolean;
  isReady: boolean;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string) => Promise<boolean>; // ✅ Исправлен тип
  hapticFeedback: (style?: HapticStyle) => void;
  notificationFeedback: (type?: NotificationType) => void;
  openLink: (url: string) => void;
  webApp: any;
}

export function useTelegram(): UseTelegramReturn {
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

  // ✅ Исправлен showAlert - теперь всегда безопасный
  const showAlert = useCallback((message: string, callback?: () => void) => {
    if (isInTelegram && window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert(message, callback);
    } else {
      alert(message);
      callback?.();
    }
  }, [isInTelegram]);

  // ✅ ИСПРАВЛЕНО: showConfirm возвращает Promise<boolean>
  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (isInTelegram && window.Telegram?.WebApp) {
        window.Telegram.WebApp.showConfirm(message, (confirmed: boolean) => {
          resolve(confirmed);
        });
      } else {
        // Fallback для браузера
        const confirmed = window.confirm(message);
        resolve(confirmed);
      }
    });
  }, [isInTelegram]);

  // Haptic Feedback для тактильной отдачи
  const hapticFeedback = useCallback((style: HapticStyle = 'medium') => {
    if (isInTelegram && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
      } catch (error) {
        console.warn('Haptic feedback error:', error);
      }
    }
  }, [isInTelegram]);

  // Уведомление с вибрацией (для success/error/warning)
  const notificationFeedback = useCallback((type: NotificationType = 'success') => {
    if (isInTelegram && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
      } catch (error) {
        console.warn('Notification feedback error:', error);
      }
    }
  }, [isInTelegram]);

  // Открытие ссылки
  const openLink = useCallback((url: string) => {
    if (isInTelegram && window.Telegram?.WebApp) {
      try {
        // Пробуем открыть через Telegram
        if (window.Telegram.WebApp.openLink) {
          window.Telegram.WebApp.openLink(url);
        } else if (window.Telegram.WebApp.openTelegramLink) {
          window.Telegram.WebApp.openTelegramLink(url);
        } else {
          window.open(url, '_blank');
        }
      } catch (error) {
        console.warn('Open link error:', error);
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  }, [isInTelegram]);

  // ✅ Дополнительный метод для закрытия WebApp
  const closeWebApp = useCallback(() => {
    if (isInTelegram && window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  }, [isInTelegram]);

  return {
    user,
    isInTelegram,
    isReady,
    showAlert,
    showConfirm,
    hapticFeedback,
    notificationFeedback,
    openLink,
    webApp: typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined,
  };
}

// ✅ Дополнительный хук для проверки Telegram без полной загрузки
export function useTelegramSimple() {
  const [isInTelegram, setIsInTelegram] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const webApp = window.Telegram?.WebApp;
    const isTelegram = !!(webApp?.initData || 
                        window.location.search.includes('tgWebAppData'));
    setIsInTelegram(isTelegram);
  }, []);

  return { isInTelegram };
}