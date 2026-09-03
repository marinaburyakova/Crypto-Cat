// lib/redis.ts
import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Создаем Redis клиент с правильными настройками
const redisClient =
  globalForRedis.redis ??
  new Redis(REDIS_URL, {
    maxRetriesPerRequest: isDevelopment ? 1 : 3,
    retryStrategy(times) {
      if (isDevelopment && times > 2) {
        console.warn('⚠️ Redis: Too many retries in dev mode, stopping');
        return null;
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    connectTimeout: isDevelopment ? 3000 : 10000,
    commandTimeout: isDevelopment ? 2000 : 5000,
    enableOfflineQueue: true,
    lazyConnect: false,
  });

// Обработчики событий
redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('ready', () => {
  console.log('✅ Redis is ready');
});

redisClient.on('error', (error) => {
  if (isDevelopment) {
    console.warn('⚠️ Redis error (dev mode):', error.message);
  } else {
    console.error('❌ Redis error:', error);
  }
});

redisClient.on('close', () => {
  if (isProduction) {
    console.warn('⚠️ Redis connection closed');
  }
});

// Функция для проверки доступности Redis
export const isRedisAvailable = async (): Promise<boolean> => {
  try {
    await redisClient.ping();
    return true;
  } catch {
    return false;
  }
};

// ✅ Обертка для безопасного использования Redis (без дублирования)
export const safeRedis = {
  async ping() {
    try {
      if (!redisClient) return 'PONG';
      return await redisClient.ping();
    } catch (error) {
      return 'PONG';
    }
  },

  async get(key: string) {
    try {
      if (!redisClient) return null;
      return await redisClient.get(key);
    } catch (error) {
      console.warn(`⚠️ Redis get failed for key ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: any, ...args: any[]) {
    try {
      if (!redisClient) return 'OK';
      return await redisClient.set(key, value, ...args);
    } catch (error) {
      console.warn(`⚠️ Redis set failed for key ${key}:`, error);
      return 'OK';
    }
  },

  async del(key: string) {
    try {
      if (!redisClient) return 0;
      return await redisClient.del(key);
    } catch (error) {
      console.warn(`⚠️ Redis del failed for key ${key}:`, error);
      return 0;
    }
  },

  async exists(key: string) {
    try {
      if (!redisClient) return 0;
      return await redisClient.exists(key);
    } catch (error) {
      console.warn(`⚠️ Redis exists failed for key ${key}:`, error);
      return 0;
    }
  },

  async hgetall(key: string) {
    try {
      if (!redisClient) return {};
      return await redisClient.hgetall(key);
    } catch (error) {
      console.warn(`⚠️ Redis hgetall failed for key ${key}:`, error);
      return {};
    }
  },

  async hset(key: string, data: Record<string, any>) {
    try {
      if (!redisClient) return 0;
      return await redisClient.hset(key, data);
    } catch (error) {
      console.warn(`⚠️ Redis hset failed for key ${key}:`, error);
      return 0;
    }
  },

  async hget(key: string, field: string) {
    try {
      if (!redisClient) return null;
      return await redisClient.hget(key, field);
    } catch (error) {
      console.warn(`⚠️ Redis hget failed for key ${key}:`, error);
      return null;
    }
  },

  async hdel(key: string, ...fields: string[]) {
    try {
      if (!redisClient) return 0;
      return await redisClient.hdel(key, ...fields);
    } catch (error) {
      console.warn(`⚠️ Redis hdel failed for key ${key}:`, error);
      return 0;
    }
  },

  async smembers(key: string) {
    try {
      if (!redisClient) return [];
      return await redisClient.smembers(key);
    } catch (error) {
      console.warn(`⚠️ Redis smembers failed for key ${key}:`, error);
      return [];
    }
  },

  async srem(key: string, ...members: string[]) {
    try {
      if (!redisClient) return 0;
      return await redisClient.srem(key, ...members);
    } catch (error) {
      console.warn(`⚠️ Redis srem failed for key ${key}:`, error);
      return 0;
    }
  },

  async sadd(key: string, ...members: string[]) {
    try {
      if (!redisClient) return 0;
      return await redisClient.sadd(key, ...members);
    } catch (error) {
      console.warn(`⚠️ Redis sadd failed for key ${key}:`, error);
      return 0;
    }
  },

  async expire(key: string, seconds: number) {
    try {
      if (!redisClient) return 0;
      return await redisClient.expire(key, seconds);
    } catch (error) {
      console.warn(`⚠️ Redis expire failed for key ${key}:`, error);
      return 0;
    }
  },

  async ttl(key: string) {
    try {
      if (!redisClient) return -2;
      return await redisClient.ttl(key);
    } catch (error) {
      console.warn(`⚠️ Redis ttl failed for key ${key}:`, error);
      return -2;
    }
  },

  async keys(pattern: string) {
    try {
      if (!redisClient) return [];
      return await redisClient.keys(pattern);
    } catch (error) {
      console.warn(`⚠️ Redis keys failed for pattern ${pattern}:`, error);
      return [];
    }
  },

  async incr(key: string) {
    try {
      if (!redisClient) return 0;
      return await redisClient.incr(key);
    } catch (error) {
      console.warn(`⚠️ Redis incr failed for key ${key}:`, error);
      return 0;
    }
  },

  async incrby(key: string, increment: number) {
    try {
      if (!redisClient) return 0;
      return await redisClient.incrby(key, increment);
    } catch (error) {
      console.warn(`⚠️ Redis incrby failed for key ${key}:`, error);
      return 0;
    }
  },

  async hincrby(key: string, field: string, increment: number) {
    try {
      if (!redisClient) return 0;
      return await redisClient.hincrby(key, field, increment);
    } catch (error) {
      console.warn(`⚠️ Redis hincrby failed for key ${key}:`, error);
      return 0;
    }
  },
};

// ✅ Экспортируем как default и как named export
const redis = redisClient;
export default redis;
export { redis };

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redisClient;
}