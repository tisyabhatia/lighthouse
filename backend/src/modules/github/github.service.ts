import { Octokit } from '@octokit/rest';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { BadRequestError, ServiceUnavailableError } from '../../lib/errors';
import type { GitHubRepoInfo } from './github.types';

class GitHubService {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: env.GITHUB_TOKEN,
      userAgent: 'lighthouse-analyzer',
    });
  }

  /**
   * Fetch repository metadata from GitHub API
   */
  async fetchRepoMetadata(owner: string, repo: string): Promise<GitHubRepoInfo> {
    try {
      logger.info(`Fetching metadata for ${owner}/${repo}`);

      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });

      return {
        owner: data.owner.login,
        name: data.name,
        fullName: data.full_name,
        url: data.html_url,
        defaultBranch: data.default_branch,
        isPrivate: data.private,
        description: data.description || undefined,
        language: data.language || undefined,
        stars: data.stargazers_count,
        forks: data.forks_count,
        size: data.size,
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw new BadRequestError(`Repository ${owner}/${repo} not found`);
      } else if (error.status === 403) {
        throw new ServiceUnavailableError('GitHub API rate limit exceeded');
      }

      logger.error('Error fetching repo metadata:', error);
      throw new ServiceUnavailableError('Failed to fetch repository metadata');
    }
  }

  /**
   * Detect the default branch for a repository
   */
  async detectDefaultBranch(owner: string, repo: string): Promise<string> {
    const metadata = await this.fetchRepoMetadata(owner, repo);
    return metadata.defaultBranch;
  }

  /**
   * Verify repository access
   */
  async verifyAccess(owner: string, repo: string): Promise<boolean> {
    try {
      await this.fetchRepoMetadata(owner, repo);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get commit SHA for a specific branch
   */
  async getCommitSha(owner: string, repo: string, branch: string): Promise<string> {
    try {
      const { data } = await this.octokit.repos.getBranch({
        owner,
        repo,
        branch,
      });

      return data.commit.sha;
    } catch (error: any) {
      if (error.status === 404) {
        throw new BadRequestError(`Branch ${branch} not found`);
      }

      logger.error('Error fetching commit SHA:', error);
      throw new ServiceUnavailableError('Failed to fetch commit SHA');
    }
  }
}

export const githubService = new GitHubService();
