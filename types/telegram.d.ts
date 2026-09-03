// types/telegram.d.ts
export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        BackButton: any;
        MainButton: any;
        openTelegramLink(url: string): unknown;
        openLink: any;
        ready: () => void;
        close: () => void;
        expand: () => void;
        showAlert: (message: string, callback?: () => void) => void;
        showPopup: (params: {
          title?: string;
          message?: string;
          buttons?: Array<{ type: string; text?: string }>;
        }) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        openInvoice: (url: string, callback: (status: string) => void) => void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          chat?: {
            id: number;
            type?: string;
            title?: string;
          };
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        version: string;
        platform: string;
        colorScheme: string;
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosing: boolean;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        sendData: (data: string) => void;
        switchInlineQuery: (query: string, chooseChatTypes?: string[]) => void;
        onEvent: (eventType: string, callback: () => void) => void;
        offEvent: (eventType: string, callback: () => void) => void;
      };
    };
  }
}