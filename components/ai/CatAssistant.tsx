// components/ai/CatAssistant.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CatAssistantProps {
  message?: string;
  isHappy?: boolean;
  isSad?: boolean;
  isThinking?: boolean;
  onCatClick?: () => void;
  autoMessages?: string[];
  interval?: number;
  // 🔥 НОВЫЕ ПРОПСЫ ДЛЯ ИНТЕГРАЦИИ С GigaChat
  onSendMessage?: (message: string) => Promise<string>;
  userId?: string;
  showInput?: boolean;
  isLoading?: boolean;
}

interface ThoughtBubbleProps {
  message: string;
  isVisible: boolean;
  isLoading?: boolean;
}

// Компонент пузыря с мыслями
const ThoughtBubble: React.FC<ThoughtBubbleProps> = ({ message, isVisible, isLoading }) => {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.8 }}
          transition={{ duration: 0.25, type: 'spring', stiffness: 200, damping: 15 }}
          className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 
                     text-zinc-900 dark:text-zinc-100 px-4 py-2 rounded-2xl rounded-bl-none
                     shadow-lg text-sm font-medium max-w-[220px] whitespace-nowrap
                     border border-zinc-200 dark:border-zinc-700 z-50 select-none"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-pulse">⏳</span>
              Думаю...
            </span>
          ) : (
            message
          )}
          <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-white dark:bg-zinc-800 
                          border-b border-r border-zinc-200 dark:border-zinc-700 
                          rotate-45" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export function CatAssistant({
  message: initialMessage = 'Мяу! 👋',
  isHappy = false,
  isSad = false,
  isThinking = false,
  onCatClick,
  onSendMessage,
  userId = 'guest',
  showInput = false,
  isLoading: externalLoading = false,
  autoMessages = [
    'Нажми на меня! 🐱',
    'Мяу-мяу! 😺',
    'Ты сегодня крут! ⭐',
    'Давай поиграем! 🎮',
    'Я тебя люблю! ❤️'
  ],
  interval = 5000
}: CatAssistantProps) {
  const [currentMessage, setCurrentMessage] = useState(initialMessage);
  const [showBubble, setShowBubble] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isPetted, setIsPetted] = useState(false);
  const [petCount, setPetCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);

  // Рефы для тотального контроля очистки таймеров
  const isMounted = useRef<boolean>(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  const clearAllLocalTimeouts = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
  };

  const getCatEmoji = () => {
    if (isSad || currentMessage.includes('груст')) return '😿';
    if (isHappy || currentMessage.includes('счастлив')) return '😸';
    if (isThinking || isLoading || externalLoading) return '🤔';
    if (isHovered) return '😺';
    if (isPetted) return '😻';
    return '🐱';
  };

  const getCatLabel = () => {
    if (isSad) return 'Грустный кот';
    if (isHappy) return 'Счастливый кот';
    if (isThinking || isLoading) return 'Думающий кот';
    return 'Кот-помощник';
  };

  // Автоматический цикл ротации случайных фраз
  useEffect(() => {
    if (autoMessages.length === 0 || onSendMessage) return;

    const cycleMessages = () => {
      if (!isMounted.current || isLoading || externalLoading) return;
      setShowBubble(false);
      
      transitionTimeoutRef.current = setTimeout(() => {
        if (!isMounted.current) return;
        const randomIndex = Math.floor(Math.random() * autoMessages.length);
        setCurrentMessage(autoMessages[randomIndex]);
        setShowBubble(true);
      }, 300);
    };

    const intervalId = setInterval(cycleMessages, interval);

    return () => {
      clearInterval(intervalId);
      clearAllLocalTimeouts();
    };
  }, [autoMessages, interval, isLoading, externalLoading, onSendMessage]);

  // Обработчик клика
  const handleCatClick = () => {
    if (isLoading || externalLoading) return;
    
    clearAllLocalTimeouts();
    setShowBubble(false);
    
    transitionTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      setCurrentMessage('Мяу! Спасибо, что нажал! 🎉');
      setShowBubble(true);
    }, 200);

    timeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      setShowBubble(false);
      
      transitionTimeoutRef.current = setTimeout(() => {
        if (!isMounted.current) return;
        const randomIndex = Math.floor(Math.random() * autoMessages.length);
        setCurrentMessage(autoMessages[randomIndex]);
        setShowBubble(true);
      }, 300);
    }, 3000);

    if (onCatClick) onCatClick();
  };

  // Обработчик поглаживания
  const handleDoubleClick = () => {
    if (isLoading || externalLoading) return;
    
    clearAllLocalTimeouts();
    setIsPetted(true);
    setShowBubble(false);
    
    setPetCount(prev => {
      const nextCount = prev + 1;
      
      transitionTimeoutRef.current = setTimeout(() => {
        if (!isMounted.current) return;
        const petMessages = ['Мур-мур! 😻', 'Ещё! Ещё! 🥰', 'Как приятно! ❤️', 'Ты лучший! ⭐'];
        const randomIndex = Math.floor(Math.random() * petMessages.length);
        setCurrentMessage(`${petMessages[randomIndex]} (x${nextCount})`);
        setShowBubble(true);
      }, 200);

      return nextCount;
    });

    timeoutRef.current = setTimeout(() => {
      if (isMounted.current) setIsPetted(false);
    }, 1000);

    const resetTimeout = setTimeout(() => {
      if (!isMounted.current) return;
      setShowBubble(false);
      
      transitionTimeoutRef.current = setTimeout(() => {
        if (!isMounted.current) return;
        setCurrentMessage(autoMessages[Math.floor(Math.random() * autoMessages.length)]);
        setShowBubble(true);
      }, 300);
    }, 3500);

    timeoutRef.current = resetTimeout;
  };

  // 🔥 ОБРАБОТЧИК ОТПРАВКИ СООБЩЕНИЯ В GigaChat
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !onSendMessage || isLoading || externalLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setShowBubble(false);

    try {
      // Добавляем сообщение пользователя в историю
      setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
      
      // Отправляем запрос
      const response = await onSendMessage(userMessage);
      
      // Обновляем сообщение кота
      setCurrentMessage(response);
      setShowBubble(true);
      
      // Добавляем ответ кота в историю
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
      
      // Определяем эмоцию по тексту
      if (response.includes('груст') || response.includes('😿')) {
        // isSad будет обновлено через пропсы
      } else if (response.includes('счастлив') || response.includes('😸')) {
        // isHappy будет обновлено через пропсы
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setCurrentMessage('Мяу! Что-то пошло не так... Попробуй ещё раз! 😿');
      setShowBubble(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Синхронизация внешних сообщений
  useEffect(() => {
    if (initialMessage && initialMessage !== currentMessage && !isLoading) {
      setShowBubble(false);
      const t = setTimeout(() => {
        if (isMounted.current) {
          setCurrentMessage(initialMessage);
          setShowBubble(true);
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [initialMessage, isLoading]);

  // Синхронизация внешнего состояния загрузки
  useEffect(() => {
    if (externalLoading) {
      setIsLoading(true);
    }
  }, [externalLoading]);

  return (
    <div className="relative inline-flex flex-col items-center select-none">
      <div className="relative">
        <ThoughtBubble 
          message={currentMessage} 
          isVisible={showBubble}
          isLoading={isLoading || externalLoading}
        />

        <motion.button
          className="relative text-6xl md:text-7xl transition-all duration-200 
                     hover:scale-110 active:scale-95 focus:outline-none
                     cursor-pointer select-none"
          onClick={handleCatClick}
          onDoubleClick={handleDoubleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            y: isPetted ? -10 : 0,
            rotate: isHovered ? [-3, 3, -3] : 0,
          }}
          transition={{
            duration: 0.3,
            rotate: {
              duration: 0.4,
              repeat: isHovered ? Infinity : 0,
              repeatType: "mirror"
            },
          }}
          aria-label={getCatLabel()}
          disabled={isLoading || externalLoading}
        >
          <span className="drop-shadow-lg block">{getCatEmoji()}</span>
          
          {/* Индикатор поглаживаний */}
          {petCount > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 -right-4 text-xs bg-yellow-500 text-white 
                         rounded-full px-1.5 py-0.5 font-bold shadow-md"
            >
              {petCount}
            </motion.span>
          )}
          
          {/* Индикатор загрузки */}
          {(isLoading || externalLoading) && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-zinc-500"
            >
              ...
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* 🔥 ПОЛЕ ВВОДА ДЛЯ ОБЩЕНИЯ С КОТОМ */}
      {showInput && onSendMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex gap-2 w-full max-w-xs"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            placeholder="Спроси кота..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 
                       dark:border-zinc-700 bg-white dark:bg-zinc-900 
                       text-zinc-900 dark:text-zinc-100
                       focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isLoading || externalLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || externalLoading}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white rounded-lg transition-colors text-sm font-medium"
          >
            {isLoading || externalLoading ? '...' : '→'}
          </button>
        </motion.div>
      )}

      {/* Декоративные искорки */}
      {isHappy && (
        <motion.div
          className="absolute -top-6 -right-6 text-2xl pointer-events-none"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.4 }}
        >
          ✨
        </motion.div>
      )}
    </div>
  );
}

export function StaticCatAssistant({ 
  message = '🐱', 
  size = 'text-4xl' 
}: { 
  message?: string; 
  size?: string;
}) {
  return (
    <div className={`inline-flex items-center justify-center ${size} select-none`}>
      {message}
    </div>
  );
}

export function CatAssistantContainer({ 
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative p-4 rounded-2xl bg-gradient-to-br 
                     from-orange-50 to-amber-50 dark:from-zinc-900 dark:to-zinc-950
                     border border-orange-200 dark:border-zinc-900
                     shadow-lg ${className}`}>
      {children}
    </div>
  );
}

export default CatAssistant;