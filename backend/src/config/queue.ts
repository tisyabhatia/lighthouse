import { Queue, QueueOptions } from 'bullmq';
import { redisQueueClient } from './redis';
import { logger } from '../lib/logger';

// Queue options
const defaultQueueOptions: QueueOptions = {
  connection: redisQueueClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100, // Keep max 100 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
};

// Analysis Queue
export const analysisQueue = new Queue('analysis', defaultQueueOptions);

// Queue event handlers
analysisQueue.on('error', (error) => {
  logger.error('Analysis queue error:', error);
});

// Helper function to add analysis job
export async function addAnalysisJob(data: {
  analysisId: string;
  repositoryUrl: string;
  branch: string;
  options: any;
}) {
  try {
    const job = await analysisQueue.add(
      'analyze-repository',
      data,
      {
        jobId: data.analysisId,
      }
    );
    logger.info(`Analysis job added: ${job.id}`);
    return job;
  } catch (error) {
    logger.error('Error adding analysis job:', error);
    throw error;
  }
}

// Get job status
export async function getJobStatus(jobId: string) {
  try {
    const job = await analysisQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
    };
  } catch (error) {
    logger.error(`Error getting job status for ${jobId}:`, error);
    return null;
  }
}

// Cancel job
export async function cancelJob(jobId: string): Promise<boolean> {
  try {
    const job = await analysisQueue.getJob(jobId);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error canceling job ${jobId}:`, error);
    return false;
  }
}

// Clean up old jobs
export async function cleanOldJobs() {
  try {
    await analysisQueue.clean(3600000, 100, 'completed'); // Clean completed jobs older than 1 hour
    await analysisQueue.clean(86400000, 100, 'failed'); // Clean failed jobs older than 24 hours
    logger.info('Old jobs cleaned');
  } catch (error) {
    logger.error('Error cleaning old jobs:', error);
  }
}

// Graceful shutdown
export async function closeQueues(): Promise<void> {
  try {
    await analysisQueue.close();
    logger.info('Queues closed');
  } catch (error) {
    logger.error('Error closing queues:', error);
  }
}
