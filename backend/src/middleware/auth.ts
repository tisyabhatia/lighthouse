import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../lib/errors';
import { env } from '../config/env';

// Simple API key authentication (can be extended with JWT later)
export function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // For development, authentication is optional
    if (env.NODE_ENV === 'development' && !env.API_KEY) {
      return next();
    }

    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedError('API key is required');
    }

    if (env.API_KEY && apiKey !== env.API_KEY) {
      throw new UnauthorizedError('Invalid API key');
    }

    next();
  } catch (error) {
    next(error);
  }
}

// Optional authentication (doesn't throw error if not authenticated)
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey && env.API_KEY && apiKey === env.API_KEY) {
      (req as any).authenticated = true;
    }

    next();
  } catch (error) {
    next(error);
  }
}
