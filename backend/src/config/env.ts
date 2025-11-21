import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  API_VERSION: z.string().default('v1'),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),

  // Queue
  QUEUE_CONCURRENCY: z.string().transform(Number).default('5'),
  JOB_TIMEOUT_MS: z.string().transform(Number).default('600000'),

  // GitHub
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_API_URL: z.string().default('https://api.github.com'),

  // AI
  AI_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gpt-4'),
  AI_MAX_TOKENS: z.string().transform(Number).default('2000'),
  AI_TEMPERATURE: z.string().transform(Number).default('0.3'),
  AI_BATCH_SIZE: z.string().transform(Number).default('10'),
  AI_RATE_LIMIT_PER_MINUTE: z.string().transform(Number).default('50'),

  // Storage
  CLONE_BASE_PATH: z.string().default('/tmp/lighthouse-repos'),
  MAX_REPO_SIZE_MB: z.string().transform(Number).default('500'),

  // Analysis
  MAX_FILE_SIZE_KB: z.string().transform(Number).default('1000'),
  INCLUDE_TESTS: z.string().transform(val => val === 'true').default('true'),
  DEFAULT_LANGUAGES: z.string().default('typescript,javascript,python,java,go'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('true'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),

  // Security
  JWT_SECRET: z.string().default('development-secret-change-in-production'),
  API_KEY: z.string().optional(),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;
