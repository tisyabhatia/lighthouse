import { Worker, Job } from 'bullmq';
import { redisQueueClient } from '../config/redis';
import { logger } from '../lib/logger';
import { parseGitHubUrl } from '../lib/utils';
import { githubService } from '../modules/github/github.service';
import { cloneService } from '../modules/github/clone.service';
import { treeBuilderService } from '../modules/filesystem/tree-builder.service';
import { metricsService } from '../modules/filesystem/metrics.service';
import { analysisRepository } from '../modules/storage/repository/analysis.repository';
import { fileTreeRepository } from '../modules/storage/repository/file-tree.repository';
import type { AnalysisJobData } from '../types/queue';

/**
 * Analysis worker - processes repository analysis jobs
 */
export class AnalysisWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'analysis',
      async (job: Job<AnalysisJobData>) => {
        return await this.processAnalysisJob(job);
      },
      {
        connection: redisQueueClient,
        concurrency: 5,
      }
    );

    this.setupEventHandlers();
  }

  /**
   * Process an analysis job
   */
  private async processAnalysisJob(job: Job<AnalysisJobData>) {
    const { analysisId, repositoryUrl, branch, options } = job.data;

    try {
      logger.info(`Starting analysis job ${analysisId} for ${repositoryUrl}`);

      // Update status to processing
      await analysisRepository.updateStatus(analysisId, 'processing');
      await job.updateProgress({ currentStep: 'Starting analysis', percentage: 0, stepsCompleted: [], stepsTotal: 4 });

      // Step 1: Parse GitHub URL
      const repoInfo = parseGitHubUrl(repositoryUrl);
      if (!repoInfo.isValid) {
        throw new Error('Invalid GitHub repository URL');
      }

      // Step 2: Fetch repository metadata
      await job.updateProgress({ currentStep: 'Fetching repository metadata', percentage: 10, stepsCompleted: [], stepsTotal: 4 });
      const metadata = await githubService.fetchRepoMetadata(repoInfo.owner, repoInfo.name);
      const commitSha = await githubService.getCommitSha(repoInfo.owner, repoInfo.name, branch || metadata.defaultBranch);

      // Update analysis with commit SHA
      await analysisRepository.updateCommitSha(analysisId, commitSha);

      // Step 3: Clone repository
      await job.updateProgress({ currentStep: 'Cloning repository', percentage: 25, stepsCompleted: ['Metadata fetched'], stepsTotal: 4 });
      const cloneResult = await cloneService.cloneRepository(repositoryUrl, {
        branch: branch || metadata.defaultBranch,
        depth: 1,
        singleBranch: true,
      });

      logger.info(`Cloned repository to ${cloneResult.localPath}`);

      // Step 4: Build file tree
      await job.updateProgress({ currentStep: 'Building file tree', percentage: 50, stepsCompleted: ['Metadata fetched', 'Repository cloned'], stepsTotal: 4 });
      const fileTree = await treeBuilderService.buildFileTree(cloneResult.localPath, {
        excludePatterns: options.excludePatterns,
        maxFileSizeKB: options.maxFileSizeKB,
        includeTests: options.includeTests,
      });

      // Step 5: Calculate metrics
      await job.updateProgress({ currentStep: 'Calculating metrics', percentage: 75, stepsCompleted: ['Metadata fetched', 'Repository cloned', 'File tree built'], stepsTotal: 4 });
      const statistics = metricsService.calculateMetrics(fileTree);

      // Step 6: Save file tree to database
      await fileTreeRepository.save(analysisId, fileTree, statistics);

      // Step 7: Clean up cloned repository
      await cloneService.deleteRepository(cloneResult.localPath);

      // Mark as completed
      await job.updateProgress({ currentStep: 'Analysis complete', percentage: 100, stepsCompleted: ['Metadata fetched', 'Repository cloned', 'File tree built', 'Metrics calculated'], stepsTotal: 4 });
      await analysisRepository.updateStatus(analysisId, 'completed');

      logger.info(`Completed analysis job ${analysisId}`);

      return {
        analysisId,
        status: 'completed',
        completedAt: new Date(),
      };
    } catch (error: any) {
      logger.error(`Error processing analysis job ${analysisId}:`, error);

      // Mark as failed
      await analysisRepository.updateStatus(analysisId, 'failed', error.message);

      throw error;
    }
  }

  /**
   * Setup event handlers for the worker
   */
  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed:`, err);
    });

    this.worker.on('error', (err) => {
      logger.error('Worker error:', err);
    });
  }

  /**
   * Close the worker gracefully
   */
  async close() {
    await this.worker.close();
    logger.info('Analysis worker closed');
  }
}

// Only start worker if this module is run directly (not imported)
if (require.main === module) {
  const worker = new AnalysisWorker();
  logger.info('Analysis worker started');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing worker');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, closing worker');
    await worker.close();
    process.exit(0);
  });
}

export const analysisWorker = new AnalysisWorker();
