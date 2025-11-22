import { Worker, Job } from 'bullmq';
import { redisQueueClient } from '../config/redis';
import { logger } from '../lib/logger';
import { parseGitHubUrl } from '../lib/utils';
import { githubService } from '../modules/github/github.service';
import { cloneService } from '../modules/github/clone.service';
import { treeBuilderService } from '../modules/filesystem/tree-builder.service';
import { metricsService } from '../modules/filesystem/metrics.service';
import { fileScannerService } from '../modules/filesystem/file-scanner.service';
import { parserService } from '../modules/parser/parser.service';
import { analysisRepository } from '../modules/storage/repository/analysis.repository';
import { fileTreeRepository } from '../modules/storage/repository/file-tree.repository';
import { dependencyRepository } from '../modules/storage/repository/dependency.repository';
import type { AnalysisJobData } from '../types/queue';
import * as path from 'path';

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
      await job.updateProgress({ currentStep: 'Starting analysis', percentage: 0, stepsCompleted: [], stepsTotal: 6 });

      // Step 1: Parse GitHub URL
      const repoInfo = parseGitHubUrl(repositoryUrl);
      if (!repoInfo.isValid) {
        throw new Error('Invalid GitHub repository URL');
      }

      // Step 2: Fetch repository metadata
      await job.updateProgress({ currentStep: 'Fetching repository metadata', percentage: 10, stepsCompleted: [], stepsTotal: 6 });
      const metadata = await githubService.fetchRepoMetadata(repoInfo.owner, repoInfo.name);
      const commitSha = await githubService.getCommitSha(repoInfo.owner, repoInfo.name, branch || metadata.defaultBranch);

      // Update analysis with commit SHA
      await analysisRepository.updateCommitSha(analysisId, commitSha);

      // Step 3: Clone repository
      await job.updateProgress({ currentStep: 'Cloning repository', percentage: 20, stepsCompleted: ['Metadata fetched'], stepsTotal: 6 });
      const cloneResult = await cloneService.cloneRepository(repositoryUrl, {
        branch: branch || metadata.defaultBranch,
        depth: 1,
        singleBranch: true,
      });

      logger.info(`Cloned repository to ${cloneResult.localPath}`);

      // Step 4: Build file tree
      await job.updateProgress({ currentStep: 'Building file tree', percentage: 40, stepsCompleted: ['Metadata fetched', 'Repository cloned'], stepsTotal: 6 });
      const fileTree = await treeBuilderService.buildFileTree(cloneResult.localPath, {
        excludePatterns: options.excludePatterns,
        maxFileSizeKB: options.maxFileSizeKB,
        includeTests: options.includeTests,
      });

      // Step 5: Calculate metrics
      await job.updateProgress({ currentStep: 'Calculating metrics', percentage: 50, stepsCompleted: ['Metadata fetched', 'Repository cloned', 'File tree built'], stepsTotal: 6 });
      const statistics = metricsService.calculateMetrics(fileTree);

      // Step 6: Save file tree to database
      await fileTreeRepository.save(analysisId, fileTree, statistics);

      // Step 7: Parse files (new step for Sprint 3)
      await job.updateProgress({ currentStep: 'Parsing files', percentage: 65, stepsCompleted: ['Metadata fetched', 'Repository cloned', 'File tree built', 'Metrics calculated'], stepsTotal: 6 });

      // Scan directory for parseable files
      const files = await fileScannerService.scanDirectory(cloneResult.localPath, {
        excludePatterns: options.excludePatterns,
        includeTests: options.includeTests,
      });

      // Filter for supported languages and convert to absolute paths
      const parseableFiles: string[] = [];
      for (const file of files) {
        const filePath = path.join(cloneResult.localPath, file);
        const shouldParse = await parserService.shouldParse(filePath);
        if (shouldParse) {
          parseableFiles.push(filePath);
        }
      }

      logger.info(`Found ${parseableFiles.length} parseable files`);

      // Parse files (limit to avoid timeout)
      const maxFilesToParse = 100; // Limit for performance
      const filesToParse = parseableFiles.slice(0, maxFilesToParse);

      const parsedFiles = await parserService.parseFilesParallel(filesToParse, {
        skipLargeFiles: true,
        maxFileSize: 1024 * 500, // 500KB max
      });

      logger.info(`Successfully parsed ${parsedFiles.length} files`);

      // Step 8: Save parsed files to database
      await job.updateProgress({ currentStep: 'Saving parsed data', percentage: 85, stepsCompleted: ['Metadata fetched', 'Repository cloned', 'File tree built', 'Metrics calculated', 'Files parsed'], stepsTotal: 6 });

      if (parsedFiles.length > 0) {
        // Make paths relative to project root before saving
        const relativeParsedFiles = parsedFiles.map((pf) => ({
          ...pf,
          path: path.relative(cloneResult.localPath, pf.path),
        }));

        await dependencyRepository.saveParsedFiles(analysisId, relativeParsedFiles);
      }

      // Step 9: Clean up cloned repository
      await cloneService.deleteRepository(cloneResult.localPath);

      // Mark as completed
      await job.updateProgress({ currentStep: 'Analysis complete', percentage: 100, stepsCompleted: ['Metadata fetched', 'Repository cloned', 'File tree built', 'Metrics calculated', 'Files parsed', 'Data saved'], stepsTotal: 6 });
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
    this.worker.on('ready', () => {
      logger.info('Worker is ready and listening for jobs');
    });

    this.worker.on('active', (job) => {
      logger.info(`Job ${job.id} is now active`);
    });

    this.worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed:`, err.message);
      logger.error('Error stack:', err.stack);
    });

    this.worker.on('error', (err) => {
      logger.error('Worker error:', err);
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn(`Job ${jobId} has stalled`);
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

// Start the worker immediately when this file is executed
const worker = new AnalysisWorker();
logger.info('🔧 Analysis worker starting...');

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

export { worker as analysisWorker };
