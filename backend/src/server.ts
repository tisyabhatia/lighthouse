import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { disconnectRedis } from './config/redis';
import { closeQueues } from './config/queue';
import { validateAIConfig } from './config/ai';
import { logger } from './lib/logger';

// Create Express app
const app = createApp();

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Validate AI configuration (warning only, not blocking)
    validateAIConfig();

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server started successfully`);
      logger.info(`📡 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 Port: ${env.PORT}`);
      logger.info(`📚 API Version: ${env.API_VERSION}`);
      logger.info(`🔗 Health check: http://localhost:${env.PORT}/api/${env.API_VERSION}/health`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await Promise.all([
            disconnectDatabase(),
            disconnectRedis(),
            closeQueues(),
          ]);

          logger.info('All connections closed successfully');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
