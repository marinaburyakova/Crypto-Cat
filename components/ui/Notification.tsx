// components/ui/Notification.tsx
'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Zap, Crown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ✅ Экспортируем тип
export type NotificationType = 'success' | 'warning' | 'error' | 'info' | 'achievement';

interface NotificationProps {
  type: NotificationType;
  message: string;
  icon?: React.ReactNode;
  duration?: number;
  onClose?: () => void;
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
  error: <AlertCircle className="w-5 h-5 text-red-400" />,
  info: <Info className="w-5 h-5 text-cyan-400" />,
  achievement: <Crown className="w-5 h-5 text-yellow-400" />,
};

const styles = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  warning: 'border-amber-500/30 bg-amber-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  info: 'border-cyan-500/30 bg-cyan-500/10',
  achievement: 'border-yellow-500/30 bg-yellow-500/10 animate-pulse',
};

export function Notification({ 
  type, 
  message, 
  icon, 
  duration = 3000, 
  onClose 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={cn(
      "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md",
      "transform transition-all duration-300",
      isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
    )}>
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl",
        styles[type]
      )}>
        <div className="flex-shrink-0">
          {icon || icons[type]}
        </div>
        <p className="flex-1 text-sm font-medium text-white">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => {
              if (onClose) {
                onClose();
              }
            }, 300);
          }}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}

// Хук для управления уведомлениями
export function useNotification() {
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    icon?: React.ReactNode;
  } | null>(null);

  const showNotification = (
    type: NotificationType,
    message: string,
    icon?: React.ReactNode
  ) => {
    setNotification({ type, message, icon });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const NotificationComponent = notification ? (
    <Notification
      type={notification.type}
      message={notification.message}
      icon={notification.icon}
      onClose={hideNotification}
    />
  ) : null;

  return { showNotification, hideNotification, NotificationComponent };
}