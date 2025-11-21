import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { apiRateLimiter } from './middleware/rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { optionalAuth } from './middleware/auth';
import routes from './routes';
import { logger } from './lib/logger';

// Create Express application
export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: env.CORS_CREDENTIALS,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression middleware
  app.use(compression());

  // Request logging
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  // Optional authentication (doesn't block requests)
  app.use(optionalAuth);

  // Rate limiting
  app.use(apiRateLimiter);

  // API routes
  app.use(`/api/${env.API_VERSION}`, routes);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'LIGHTHOUSE API',
      version: env.API_VERSION,
      description: 'GitHub Repository Analyzer API',
      documentation: '/api/v1/health',
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
