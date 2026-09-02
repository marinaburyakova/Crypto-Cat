// lib/gigachat.ts
import crypto from 'crypto';

// Типы для ответа питомца
export interface PetResponse {
  text: string;
  emotion: 'joy' | 'sad' | 'playful' | 'idle';
}

// Конфигурация GigaChat
interface GigaChatConfig {
  credentials: string;
  scope: string;
  apiUrl: string;
  authUrl: string;
}

// Валидные эмоции для питомца
const VALID_EMOTIONS = ['joy', 'sad', 'playful', 'idle'] as const;
type ValidEmotion = typeof VALID_EMOTIONS[number];

// Запасные ответы при ошибках
const FALLBACK_RESPONSES: PetResponse[] = [
  { text: 'Мяу! Я немного отвлекся, повтори, пожалуйста! 🐾', emotion: 'idle' },
  { text: 'Мур-мур! Связь с космосом прервалась! ✨', emotion: 'sad' },
  { text: 'Я здесь! Просто думал о звездах... 🌟', emotion: 'playful' },
  { text: 'Мяу-мяу! Давай еще разок! 🎮', emotion: 'joy' }
];

export class GigaChatEngine {
  private config: GigaChatConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    const credentials = process.env.GIGACHAT_CREDENTIALS;
    
    if (!credentials) {
      throw new Error('GIGACHAT_CREDENTIALS is required in environment variables');
    }

    this.config = {
      credentials,
      scope: process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS',
      apiUrl: process.env.GIGACHAT_API_URL || 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
      authUrl: process.env.GIGACHAT_AUTH_URL || 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'
    };
  }

  /**
   * Выполняет HTTP запрос с таймаутом и обработкой ошибок
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Генерирует UUID для RqUID
   */
  private generateRqUID(): string {
    try {
      // Используем crypto.randomUUID() если доступен
      if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      // Fallback для старых версий Node.js
      return crypto.randomBytes(16).toString('hex');
    } catch {
      // Fallback если что-то пошло не так
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
  }

  /**
   * Получает или обновляет access token
   */
  private async getAccessToken(): Promise<string> {
    // Проверяем, действителен ли текущий токен (с запасом 5 минут)
    const isTokenValid = this.accessToken !== null && Date.now() < this.tokenExpiry - 300000;
    if (isTokenValid) {
      // ✅ ИСПРАВЛЕНО: возвращаем this.accessToken как string (он точно не null)
      return this.accessToken as string;
    }

    const body = new URLSearchParams({
      scope: this.config.scope
    });

    try {
      const response = await this.fetchWithTimeout(
        this.config.authUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Authorization': `Basic ${this.config.credentials}`,
            'RqUID': this.generateRqUID()
          },
          body: body.toString()
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`OAuth failed: ${response.status} - ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!data.access_token || typeof data.access_token !== 'string') {
        throw new Error('Invalid access_token in response');
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = data.expires_at || Date.now() + 3600000;

      // ✅ ИСПРАВЛЕНО: возвращаем this.accessToken как string (он точно не null)
      return this.accessToken as string;

    } catch (error) {
      // Очищаем токен при ошибке
      this.accessToken = null;
      this.tokenExpiry = 0;
      
      console.error('❌ GigaChat authentication failed:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Failed to authenticate with GigaChat API');
    }
  }

  /**
   * Валидирует и нормализует ответ от GigaChat
   */
  private validateResponse(content: unknown): PetResponse {
    // Проверяем, что content - это объект
    if (!content || typeof content !== 'object') {
      throw new Error('Invalid response: content is not an object');
    }

    const data = content as Record<string, unknown>;

    // Извлекаем и валидируем текст
    const text = typeof data.text === 'string' 
      ? data.text.trim().substring(0, 200) 
      : 'Я задумался о звездах... ✨';

    // Извлекаем и валидируем эмоцию
    const emotion = typeof data.emotion === 'string' && VALID_EMOTIONS.includes(data.emotion as ValidEmotion)
      ? data.emotion as ValidEmotion
      : 'idle';

    return { text, emotion };
  }

  /**
   * Создает системный промпт для GigaChat
   */
  private createSystemPrompt(): string {
    return `Ты — цифровой ИИ-питомец Cyber-Pet в GameFi кликере. Твой хозяин — ребенок.
Отвечай дружелюбно, очень коротко (1-2 емких предложения) и используй эмодзи.
Тебе КАТЕГОРИЧЕСКИ запрещено использовать нецензурную лексику, обсуждать политику, насилие и криптовалюты.

Ты должен вернуть ответ СТРОГО в формате JSON-объекта со следующими полями:
- text: текст твоей реплики пользователю.
- emotion: строка, определяющая твою текущую эмоцию. Варианты: "joy", "sad", "playful", "idle".

Ответ должен содержать исключительно JSON-объект, без какого-либо дополнительного текста.`;
  }

  /**
   * Основной метод взаимодействия с питомцем
   */
  async interactWithPet(
    userMessage: string,
    history: Array<{ role: string; content: string }>
  ): Promise<PetResponse> {
    // Валидация входных данных
    if (!userMessage || typeof userMessage !== 'string') {
      console.warn('⚠️ Invalid userMessage provided');
      return this.getFallbackResponse();
    }

    // Ограничиваем длину сообщения
    const trimmedMessage = userMessage.trim().substring(0, 500);
    if (!trimmedMessage) {
      return this.getFallbackResponse();
    }

    // Ограничиваем историю и фильтруем невалидные сообщения
    const safeHistory = history
      .slice(-10)
      .filter(msg => msg && typeof msg.role === 'string' && typeof msg.content === 'string')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content.trim().substring(0, 500)
      }));

    try {
      const token = await this.getAccessToken();

      // Формируем запрос
      const messages = [
        { role: 'system' as const, content: this.createSystemPrompt() },
        ...safeHistory,
        { role: 'user' as const, content: trimmedMessage }
      ];

      const requestBody = {
        model: 'GigaChat',
        messages,
        temperature: 0.7,
        max_tokens: 150,
        stream: false,
        repetition_penalty: 1.0
      };

      // Отправляем запрос
      const response = await this.fetchWithTimeout(
        this.config.apiUrl,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      // Проверяем ответ
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`GigaChat API error: ${response.status} - ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();

      // Извлекаем content с проверкой на null/undefined
      const content = data?.choices?.[0]?.message?.content;
      
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid response structure from GigaChat');
      }

      // Пробуем распарсить JSON
      try {
        const parsed = JSON.parse(content);
        return this.validateResponse(parsed);
      } catch (parseError) {
        // Если не JSON, используем как текст
        console.warn('⚠️ Response is not JSON, using as plain text');
        return {
          text: content.substring(0, 200),
          emotion: 'idle'
        };
      }

    } catch (error) {
      // Логируем ошибку (без чувствительных данных)
      console.error('❌ GigaChat interaction failed:', error instanceof Error ? error.message : 'Unknown error');
      return this.getFallbackResponse();
    }
  }

  /**
   * Возвращает случайный запасной ответ
   */
  private getFallbackResponse(): PetResponse {
    const index = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
    return FALLBACK_RESPONSES[index];
  }
}

// Экспортируем единственный экземпляр
export const gigachatEngine = new GigaChatEngine();