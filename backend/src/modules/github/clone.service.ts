import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs-extra';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { generateId } from '../../lib/utils';
import { InternalServerError } from '../../lib/errors';
import type { CloneOptions, CloneResult } from './github.types';

class CloneService {
  private git: SimpleGit;
  private baseClonePath: string;

  constructor() {
    this.git = simpleGit();
    this.baseClonePath = env.CLONE_BASE_PATH;
    this.ensureCloneDirectoryExists();
  }

  private async ensureCloneDirectoryExists(): Promise<void> {
    try {
      await fs.ensureDir(this.baseClonePath);
    } catch (error) {
      logger.error('Failed to create clone directory:', error);
    }
  }

  /**
   * Clone a repository to local storage
   */
  async cloneRepository(
    repoUrl: string,
    options: CloneOptions = {}
  ): Promise<CloneResult> {
    const cloneId = generateId('clone');
    const localPath = path.join(this.baseClonePath, cloneId);

    try {
      logger.info(`Cloning repository ${repoUrl} to ${localPath}`);

      // Ensure parent directory exists
      await fs.ensureDir(localPath);

      // Build clone options
      const cloneOptions: string[] = [];

      if (options.branch) {
        cloneOptions.push('--branch', options.branch);
      }

      if (options.depth) {
        cloneOptions.push('--depth', options.depth.toString());
      }

      if (options.singleBranch) {
        cloneOptions.push('--single-branch');
      }

      // Clone the repository
      await this.git.clone(repoUrl, localPath, cloneOptions);

      // Get current commit SHA and branch
      const repoGit = simpleGit(localPath);
      const log = await repoGit.log(['-1']);
      const branch = await repoGit.revparse(['--abbrev-ref', 'HEAD']);

      const result: CloneResult = {
        localPath,
        commitSha: log.latest?.hash || '',
        branch: branch.trim(),
        clonedAt: new Date(),
      };

      logger.info(`Successfully cloned repository to ${localPath}`);
      return result;
    } catch (error) {
      logger.error('Error cloning repository:', error);

      // Clean up on failure
      try {
        await fs.remove(localPath);
      } catch (cleanupError) {
        logger.error('Error cleaning up failed clone:', cleanupError);
      }

      throw new InternalServerError('Failed to clone repository');
    }
  }

  /**
   * Get repository size in bytes
   */
  async getRepositorySize(localPath: string): Promise<number> {
    try {
      let totalSize = 0;
      const files = await fs.readdir(localPath, { withFileTypes: true });

      for (const file of files) {
        // Skip .git directory
        if (file.name === '.git') continue;

        const filePath = path.join(localPath, file.name);

        if (file.isDirectory()) {
          totalSize += await this.getRepositorySize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      logger.error('Error calculating repository size:', error);
      return 0;
    }
  }

  /**
   * Delete cloned repository
   */
  async deleteRepository(localPath: string): Promise<void> {
    try {
      await fs.remove(localPath);
      logger.info(`Deleted repository at ${localPath}`);
    } catch (error) {
      logger.error('Error deleting repository:', error);
      throw new InternalServerError('Failed to delete repository');
    }
  }

  /**
   * Check if repository exists locally
   */
  async repositoryExists(localPath: string): Promise<boolean> {
    try {
      return await fs.pathExists(localPath);
    } catch {
      return false;
    }
  }
}

export const cloneService = new CloneService();
