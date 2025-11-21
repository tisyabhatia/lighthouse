import path from 'path';
import fs from 'fs-extra';
import { glob } from 'fast-glob';
import ignore from 'ignore';
import { logger } from '../../lib/logger';
import { getFileExtension, isTestFile, isConfigFile } from '../../lib/utils';

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.scala': 'scala',
  '.sh': 'shell',
  '.bash': 'shell',
  '.sql': 'sql',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.json': 'json',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.txt': 'text',
};

const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '.next/**',
  '.nuxt/**',
  'out/**',
  'vendor/**',
  '__pycache__/**',
  '*.pyc',
  '.venv/**',
  'venv/**',
  'target/**',
  'bin/**',
  'obj/**',
  '.idea/**',
  '.vscode/**',
  '*.min.js',
  '*.min.css',
  '*.map',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

class FileScannerService {
  /**
   * Detect programming language from file extension
   */
  detectLanguage(filePath: string): string {
    const ext = getFileExtension(filePath);
    return LANGUAGE_MAP[ext] || 'unknown';
  }

  /**
   * Scan directory and return all files
   */
  async scanDirectory(
    dirPath: string,
    options: {
      excludePatterns?: string[];
      maxFileSizeKB?: number;
      includeTests?: boolean;
    } = {}
  ): Promise<string[]> {
    try {
      const { excludePatterns = [], maxFileSizeKB = 1000, includeTests = true } = options;

      // Combine default and custom ignore patterns
      const allIgnorePatterns = [...DEFAULT_IGNORE_PATTERNS, ...excludePatterns];

      // Load .gitignore if exists
      const gitignorePath = path.join(dirPath, '.gitignore');
      let ig = ignore();

      if (await fs.pathExists(gitignorePath)) {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
        ig = ignore().add(gitignoreContent);
      }

      // Add our default patterns
      ig.add(allIgnorePatterns);

      // Find all files
      const files = await glob('**/*', {
        cwd: dirPath,
        absolute: false,
        dot: false,
        ignore: allIgnorePatterns,
      });

      // Filter files
      const filteredFiles: string[] = [];

      for (const file of files) {
        const fullPath = path.join(dirPath, file);

        // Check if ignored
        if (ig.ignores(file)) continue;

        // Check if it's a file (not directory)
        const stats = await fs.stat(fullPath);
        if (!stats.isFile()) continue;

        // Check file size
        const sizeKB = stats.size / 1024;
        if (sizeKB > maxFileSizeKB) {
          logger.warn(`Skipping large file: ${file} (${sizeKB.toFixed(2)} KB)`);
          continue;
        }

        // Check if test file
        if (!includeTests && isTestFile(file)) {
          continue;
        }

        filteredFiles.push(file);
      }

      logger.info(`Scanned ${filteredFiles.length} files in ${dirPath}`);
      return filteredFiles;
    } catch (error) {
      logger.error('Error scanning directory:', error);
      return [];
    }
  }

  /**
   * Categorize files by language
   */
  categorizeByLanguage(files: string[]): Record<string, string[]> {
    const categorized: Record<string, string[]> = {};

    for (const file of files) {
      const language = this.detectLanguage(file);

      if (!categorized[language]) {
        categorized[language] = [];
      }

      categorized[language].push(file);
    }

    return categorized;
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string) {
    try {
      const stats = await fs.stat(filePath);
      const ext = getFileExtension(filePath);

      return {
        language: this.detectLanguage(filePath),
        extension: ext,
        size: stats.size,
        isTest: isTestFile(filePath),
        isConfig: isConfigFile(filePath),
        lastModified: stats.mtime,
      };
    } catch (error) {
      logger.error(`Error getting metadata for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Count lines in a file
   */
  async countLines(filePath: string): Promise<number> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content.split('\n').length;
    } catch (error) {
      logger.error(`Error counting lines in ${filePath}:`, error);
      return 0;
    }
  }
}

export const fileScannerService = new FileScannerService();
