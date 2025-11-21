import { logger } from '../../lib/logger';
import type { FileTreeNode, FileTreeStatistics } from '../../types/models';

class MetricsService {
  /**
   * Calculate comprehensive metrics from file tree
   */
  calculateMetrics(tree: FileTreeNode): FileTreeStatistics {
    logger.info('Calculating file tree metrics');

    const stats: FileTreeStatistics = {
      totalFiles: 0,
      totalDirectories: 0,
      totalLines: 0,
      languageBreakdown: {},
      sizeBreakdown: {
        totalSize: 0,
        averageFileSize: 0,
      },
    };

    this.traverseAndCount(tree, stats);

    // Calculate average file size
    if (stats.totalFiles > 0) {
      stats.sizeBreakdown.averageFileSize = Math.round(
        stats.sizeBreakdown.totalSize / stats.totalFiles
      );
    }

    logger.info('Metrics calculated:', {
      totalFiles: stats.totalFiles,
      totalDirectories: stats.totalDirectories,
      totalLines: stats.totalLines,
      languages: Object.keys(stats.languageBreakdown).length,
    });

    return stats;
  }

  /**
   * Recursively traverse tree and count
   */
  private traverseAndCount(node: FileTreeNode, stats: FileTreeStatistics): void {
    if (node.type === 'directory') {
      stats.totalDirectories++;

      if (node.children) {
        for (const child of node.children) {
          this.traverseAndCount(child, stats);
        }
      }
    } else if (node.type === 'file') {
      stats.totalFiles++;

      if (node.metadata) {
        // Count lines
        stats.totalLines += node.metadata.linesOfCode;

        // Count by language
        const lang = node.metadata.language;
        if (!stats.languageBreakdown[lang]) {
          stats.languageBreakdown[lang] = 0;
        }
        stats.languageBreakdown[lang]++;

        // Count size
        stats.sizeBreakdown.totalSize += node.metadata.size;
      }
    }
  }

  /**
   * Get language distribution percentages
   */
  getLanguageDistribution(stats: FileTreeStatistics): Record<string, number> {
    const distribution: Record<string, number> = {};
    const total = stats.totalFiles;

    if (total === 0) return distribution;

    for (const [language, count] of Object.entries(stats.languageBreakdown)) {
      distribution[language] = Math.round((count / total) * 100 * 100) / 100;
    }

    return distribution;
  }

  /**
   * Get top N languages by file count
   */
  getTopLanguages(stats: FileTreeStatistics, limit: number = 5): Array<{ language: string; count: number }> {
    return Object.entries(stats.languageBreakdown)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Calculate complexity score (simple heuristic based on file count and LOC)
   */
  calculateComplexityScore(stats: FileTreeStatistics): number {
    const fileScore = Math.min(stats.totalFiles / 100, 1) * 40;
    const locScore = Math.min(stats.totalLines / 10000, 1) * 40;
    const languageScore = Math.min(Object.keys(stats.languageBreakdown).length / 5, 1) * 20;

    return Math.round(fileScore + locScore + languageScore);
  }
}

export const metricsService = new MetricsService();
