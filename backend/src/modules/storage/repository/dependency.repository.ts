import { prisma } from '../../../config/database';
import { ParsedFile } from '../../../types/models';

export class DependencyRepository {
  /**
   * Save parsed file data for an analysis
   */
  async saveParsedFiles(analysisId: string, parsedFiles: ParsedFile[]): Promise<void> {
    // Convert parsed files to JSON and store
    const data = parsedFiles.map((file) => ({
      analysisId,
      filePath: file.path,
      language: file.language,
      data: JSON.stringify(file),
    }));

    // Batch insert
    await prisma.parsedFile.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Get parsed files for an analysis
   */
  async getParsedFiles(analysisId: string): Promise<ParsedFile[]> {
    const records = await prisma.parsedFile.findMany({
      where: { analysisId },
    });

    return records.map((record: any) => JSON.parse(record.data as string) as ParsedFile);
  }

  /**
   * Get a single parsed file
   */
  async getParsedFile(analysisId: string, filePath: string): Promise<ParsedFile | null> {
    const record = await prisma.parsedFile.findFirst({
      where: {
        analysisId,
        filePath,
      },
    });

    if (!record) return null;

    return JSON.parse(record.data as string) as ParsedFile;
  }

  /**
   * Delete parsed files for an analysis
   */
  async deleteParsedFiles(analysisId: string): Promise<void> {
    await prisma.parsedFile.deleteMany({
      where: { analysisId },
    });
  }

  /**
   * Get count of parsed files
   */
  async getCount(analysisId: string): Promise<number> {
    return await prisma.parsedFile.count({
      where: { analysisId },
    });
  }

  /**
   * Get parsed files by language
   */
  async getParsedFilesByLanguage(
    analysisId: string,
    language: string
  ): Promise<ParsedFile[]> {
    const records = await prisma.parsedFile.findMany({
      where: {
        analysisId,
        language,
      },
    });

    return records.map((record: any) => JSON.parse(record.data as string) as ParsedFile);
  }

  /**
   * Get language statistics
   */
  async getLanguageStats(analysisId: string): Promise<Record<string, number>> {
    const records = await prisma.parsedFile.groupBy({
      by: ['language'],
      where: { analysisId },
      _count: true,
    });

    const stats: Record<string, number> = {};
    for (const record of records) {
      stats[record.language] = (record as any)._count;
    }

    return stats;
  }
}

export const dependencyRepository = new DependencyRepository();
