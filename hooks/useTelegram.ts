// hooks/useTelegram.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

export type NotificationType = 'error' | 'success' | 'warning' | 'info' | 'achievement';
export type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface UseTelegramReturn {
  user: TelegramUser | null;
  isInTelegram: boolean;
  isReady: boolean;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string) => Promise<boolean>;
  hapticFeedback: (style?: HapticStyle) => void;
  notificationFeedback: (type?: NotificationType) => void;
  openLink: (url: string) => void;
  closeWebApp: () => void;
  webApp: any;
}

export function useTelegram(): UseTelegramReturn {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkTelegram = () => {
      // ✅ Всегда устанавливаем isReady в true, даже если ошибка
      try {
        if (typeof window === 'undefined') {
          console.log('🔧 Not in browser');
          setIsReady(true);
          return;
        }

        const webApp = window.Telegram?.WebApp;
        const isTelegram = !!(webApp?.initData || 
                            window.location.search.includes('tgWebAppData'));

        console.log('📱 Telegram check:', { isTelegram, hasWebApp: !!webApp });

        setIsInTelegram(isTelegram);

        if (isTelegram && webApp) {
          try {
            webApp.ready();
            webApp.expand();

            const userData = webApp.initDataUnsafe?.user;
            if (userData) {
              setUser(userData);
              console.log('👤 User data loaded:', userData);
            }
          } catch (webAppError) {
            console.warn('⚠️ WebApp error:', webAppError);
          }
        }
      } catch (error) {
        console.error('❌ Telegram initialization error:', error);
      } finally {
        // ✅ ВСЕГДА устанавливаем isReady в true
        setIsReady(true);
        console.log('✅ Telegram hook ready, isInTelegram:', isInTelegram);
      }
    };

    checkTelegram();
  }, []);

  const showAlert = useCallback((message: string, callback?: () => void) => {
    if (isInTelegram && window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert(message, callback);
    } else {
      alert(message);
      callback?.();
    }
  }, [isInTelegram]);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (isInTelegram && window.Telegram?.WebApp) {
        window.Telegram.WebApp.showConfirm(message, (confirmed: boolean) => {
          resolve(confirmed);
        });
      } else {
        const confirmed = window.confirm(message);
        resolve(confirmed);
      }
    });
  }, [isInTelegram]);

  const hapticFeedback = useCallback((style: HapticStyle = 'medium') => {
    if (isInTelegram && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
      } catch (error) {
        console.warn('Haptic feedback error:', error);
      }
    }
  }, [isInTelegram]);

  const notificationFeedback = useCallback((type: NotificationType = 'success') => {
    if (isInTelegram && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        let mappedType: 'error' | 'success' | 'warning' = 'success';
        
        if (type === 'error') mappedType = 'error';
        else if (type === 'warning') mappedType = 'warning';
        else if (type === 'success' || type === 'achievement' || type === 'info') {
          mappedType = 'success';
        }
        
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(mappedType);
      } catch (error) {
        console.warn('Notification feedback error:', error);
      }
    }
  }, [isInTelegram]);

  const openLink = useCallback((url: string) => {
    if (isInTelegram && window.Telegram?.WebApp) {
      try {
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
    closeWebApp,
    webApp: typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined,
  };
}

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