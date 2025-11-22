import { ParsedFile } from '../../types/models';
import { languageDetector } from './language-detector';
import { typescriptParser } from './parsers/typescript.parser';
import { javascriptParser } from './parsers/javascript.parser';
import { pythonParser } from './parsers/python.parser';

export interface ParserOptions {
  skipLargeFiles?: boolean;
  maxFileSize?: number; // in bytes
}

export class ParserService {
  private readonly DEFAULT_MAX_FILE_SIZE = 1024 * 1024; // 1MB

  /**
   * Parse a file and extract code structure
   */
  async parseFile(filePath: string, options: ParserOptions = {}): Promise<ParsedFile | null> {
    const maxSize = options.maxFileSize || this.DEFAULT_MAX_FILE_SIZE;

    // Check file size if requested
    if (options.skipLargeFiles) {
      try {
        const fs = await import('fs/promises');
        const stats = await fs.stat(filePath);

        if (stats.size > maxSize) {
          console.log(`Skipping large file: ${filePath} (${stats.size} bytes)`);
          return null;
        }
      } catch (error) {
        console.error(`Error checking file size for ${filePath}:`, error);
        return null;
      }
    }

    // Detect language
    const detection = await languageDetector.detectLanguage(filePath);

    // Check if language is supported for parsing
    if (!languageDetector.isSupportedForParsing(detection.language)) {
      return null;
    }

    // Route to appropriate parser
    try {
      switch (detection.language) {
        case 'typescript':
          return await typescriptParser.parseFile(filePath);

        case 'javascript':
          return await javascriptParser.parseFile(filePath);

        case 'python':
          return await pythonParser.parseFile(filePath);

        default:
          console.log(`No parser available for language: ${detection.language}`);
          return null;
      }
    } catch (error: any) {
      console.error(`Error parsing file ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Parse multiple files
   */
  async parseFiles(filePaths: string[], options: ParserOptions = {}): Promise<ParsedFile[]> {
    const results: ParsedFile[] = [];

    for (const filePath of filePaths) {
      const parsed = await this.parseFile(filePath, options);
      if (parsed) {
        results.push(parsed);
      }
    }

    return results;
  }

  /**
   * Parse files in parallel
   */
  async parseFilesParallel(
    filePaths: string[],
    options: ParserOptions = {}
  ): Promise<ParsedFile[]> {
    const promises = filePaths.map((filePath) => this.parseFile(filePath, options));
    const results = await Promise.all(promises);

    // Filter out nulls
    return results.filter((r): r is ParsedFile => r !== null);
  }

  /**
   * Check if a file should be parsed
   */
  async shouldParse(filePath: string): Promise<boolean> {
    const detection = await languageDetector.detectLanguage(filePath);
    return languageDetector.isSupportedForParsing(detection.language);
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return ['typescript', 'javascript', 'python'];
  }
}

// Export singleton instance
export const parserService = new ParserService();
