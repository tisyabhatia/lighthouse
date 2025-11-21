import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { RateLimitError } from '../lib/errors';

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    throw new RateLimitError('Too many requests, please try again later');
  },
  skip: (req) => {
    // Skip rate limiting in development if no API key is set
    return env.NODE_ENV === 'development' && !env.API_KEY;
  },
});

// Strict rate limiter for expensive operations (analysis creation)
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 analysis requests per hour
  message: 'Analysis rate limit exceeded. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    throw new RateLimitError(
      'Analysis rate limit exceeded. Maximum 10 analyses per hour.'
    );
  },
  skip: (req) => {
    return env.NODE_ENV === 'development' && !env.API_KEY;
  },
});
