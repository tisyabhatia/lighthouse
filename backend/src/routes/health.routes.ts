import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { checkDatabaseHealth } from '../config/database';
import { checkRedisHealth } from '../config/redis';
import { HealthCheckResponse } from '../types/api';

const router = Router();

// Health check endpoint
router.get(
  '/health',
  asyncHandler(async (req: Request, res: Response) => {
    const [databaseHealthy, redisHealthy] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
    ]);

    const allHealthy = databaseHealthy && redisHealthy;

    const response: HealthCheckResponse = {
      status: allHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: databaseHealthy,
        redis: redisHealthy,
        queue: redisHealthy, // Queue depends on Redis
      },
    };

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(response);
  })
);

// Simple ping endpoint
router.get('/ping', (req: Request, res: Response) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

export default router;
