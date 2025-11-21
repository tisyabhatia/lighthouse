import { prisma } from '../../../config/database';
import { logger } from '../../../lib/logger';
import type { FileTreeNode, FileTreeStatistics } from '../../../types/models';

export class FileTreeRepository {
  /**
   * Save file tree for an analysis
   */
  async save(analysisId: string, tree: FileTreeNode, statistics: FileTreeStatistics) {
    try {
      return await prisma.fileTree.create({
        data: {
          analysisId,
          tree: tree as any,
          totalFiles: statistics.totalFiles,
          totalDirectories: statistics.totalDirectories,
          totalLines: statistics.totalLines,
          totalSize: BigInt(statistics.sizeBreakdown.totalSize),
          languageBreakdown: statistics.languageBreakdown as any,
        },
      });
    } catch (error) {
      logger.error(`Error saving file tree for analysis ${analysisId}:`, error);
      throw error;
    }
  }

  /**
   * Get file tree by analysis ID
   */
  async getByAnalysisId(analysisId: string) {
    try {
      const fileTree = await prisma.fileTree.findUnique({
        where: { analysisId },
      });

      if (!fileTree) return null;

      // Convert BigInt to number for total size
      return {
        ...fileTree,
        totalSize: Number(fileTree.totalSize),
      };
    } catch (error) {
      logger.error(`Error getting file tree for analysis ${analysisId}:`, error);
      return null;
    }
  }

  /**
   * Delete file tree by analysis ID
   */
  async deleteByAnalysisId(analysisId: string) {
    try {
      await prisma.fileTree.delete({
        where: { analysisId },
      });
      return true;
    } catch (error) {
      logger.error(`Error deleting file tree for analysis ${analysisId}:`, error);
      return false;
    }
  }
}

export const fileTreeRepository = new FileTreeRepository();
