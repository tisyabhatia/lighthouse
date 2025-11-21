import { prisma } from '../../../config/database';
import { logger } from '../../../lib/logger';
import type { AnalysisOptions, JobStatus, RepoMetadata } from '../../../types/models';

export class AnalysisRepository {
  /**
   * Create a new analysis record
   */
  async create(data: {
    id: string;
    repositoryUrl: string;
    owner: string;
    name: string;
    branch: string;
    options: AnalysisOptions;
  }) {
    try {
      return await prisma.analysis.create({
        data: {
          id: data.id,
          repositoryUrl: data.repositoryUrl,
          owner: data.owner,
          name: data.name,
          branch: data.branch,
          status: 'queued',
          options: data.options as any,
        },
      });
    } catch (error) {
      logger.error('Error creating analysis:', error);
      throw error;
    }
  }

  /**
   * Get analysis by ID
   */
  async findById(id: string) {
    try {
      return await prisma.analysis.findUnique({
        where: { id },
        include: {
          fileTree: true,
          dependencies: true,
          summaries: true,
          impactAnalysis: true,
          onboarding: true,
        },
      });
    } catch (error) {
      logger.error(`Error finding analysis ${id}:`, error);
      return null;
    }
  }

  /**
   * Update analysis status
   */
  async updateStatus(id: string, status: JobStatus, error?: string) {
    try {
      const updateData: any = { status };

      if (status === 'processing' && !error) {
        updateData.startedAt = new Date();
      } else if (status === 'completed' || status === 'failed') {
        updateData.completedAt = new Date();
      }

      if (error) {
        updateData.error = error;
      }

      return await prisma.analysis.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      logger.error(`Error updating analysis status ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update analysis with commit SHA
   */
  async updateCommitSha(id: string, commitSha: string) {
    try {
      return await prisma.analysis.update({
        where: { id },
        data: { commitSha },
      });
    } catch (error) {
      logger.error(`Error updating commit SHA for analysis ${id}:`, error);
      throw error;
    }
  }

  /**
   * List all analyses with pagination
   */
  async list(options: {
    limit?: number;
    offset?: number;
    status?: JobStatus;
  } = {}) {
    try {
      const { limit = 20, offset = 0, status } = options;

      const where = status ? { status } : {};

      const [analyses, total] = await Promise.all([
        prisma.analysis.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            repositoryUrl: true,
            owner: true,
            name: true,
            branch: true,
            status: true,
            createdAt: true,
            completedAt: true,
            error: true,
          },
        }),
        prisma.analysis.count({ where }),
      ]);

      return { analyses, total };
    } catch (error) {
      logger.error('Error listing analyses:', error);
      return { analyses: [], total: 0 };
    }
  }

  /**
   * Delete analysis by ID
   */
  async delete(id: string) {
    try {
      await prisma.analysis.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      logger.error(`Error deleting analysis ${id}:`, error);
      return false;
    }
  }

  /**
   * Get analysis count by status
   */
  async getCountByStatus() {
    try {
      const result = await prisma.analysis.groupBy({
        by: ['status'],
        _count: true,
      });

      const counts: Record<string, number> = {};
      for (const item of result) {
        counts[item.status] = item._count;
      }

      return counts;
    } catch (error) {
      logger.error('Error getting analysis counts:', error);
      return {};
    }
  }
}

export const analysisRepository = new AnalysisRepository();
