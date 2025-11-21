import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse, isOperationalError } from '../lib/errors';
import { logger } from '../lib/logger';
import { env } from '../config/env';

// Global error handler middleware
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Server error:', {
        error: err.message,
        stack: err.stack,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
      });
    } else {
      logger.warn('Client error:', {
        error: err.message,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
      });
    }
  } else {
    logger.error('Unexpected error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Format error response
  const errorResponse = formatErrorResponse(err);

  // Don't expose internal error details in production
  if (env.NODE_ENV === 'production' && errorResponse.statusCode === 500) {
    errorResponse.message = 'Internal server error';
    delete errorResponse.details;
  }

  // Send error response
  res.status(errorResponse.statusCode).json(errorResponse);
}

// 404 handler for undefined routes
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = {
    error: 'NotFoundError',
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(error);
}

// Async error wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
