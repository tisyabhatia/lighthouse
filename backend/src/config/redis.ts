import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../lib/logger';

// Redis client configuration
const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Reconnect when Redis is in readonly mode
      return true;
    }
    return false;
  },
};

// Redis client for general caching
export const redisClient = new Redis(redisConfig);

// Redis client for BullMQ
export const redisQueueClient = new Redis(redisConfig);

// Event handlers
redisClient.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redisClient.on('error', (error) => {
  logger.error('❌ Redis connection error:', error);
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisQueueClient.on('connect', () => {
  logger.info('✅ Redis queue client connected');
});

redisQueueClient.on('error', (error) => {
  logger.error('❌ Redis queue client error:', error);
});

// Graceful shutdown
export async function disconnectRedis(): Promise<void> {
  try {
    await Promise.all([redisClient.quit(), redisQueueClient.quit()]);
    logger.info('Redis clients disconnected');
  } catch (error) {
    logger.error('Error disconnecting Redis:', error);
  }
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redisClient.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
}

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redisClient.setex(key, ttlSeconds, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },
};
