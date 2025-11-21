import { randomBytes } from 'crypto';
import path from 'path';

// ============================================================================
// ID GENERATION
// ============================================================================

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(8).toString('hex');
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

export function generateAnalysisId(): string {
  return generateId('analysis');
}

// ============================================================================
// URL PARSING
// ============================================================================

export interface GitHubRepoInfo {
  owner: string;
  name: string;
  url: string;
  isValid: boolean;
}

export function parseGitHubUrl(url: string): GitHubRepoInfo {
  try {
    // Support multiple GitHub URL formats
    // https://github.com/owner/repo
    // https://github.com/owner/repo.git
    // git@github.com:owner/repo.git

    let cleanUrl = url.trim();

    // Handle SSH URLs
    if (cleanUrl.startsWith('git@github.com:')) {
      cleanUrl = cleanUrl.replace('git@github.com:', 'https://github.com/');
    }

    // Remove .git suffix
    cleanUrl = cleanUrl.replace(/\.git$/, '');

    // Parse URL
    const urlObj = new URL(cleanUrl);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    if (pathParts.length >= 2) {
      return {
        owner: pathParts[0],
        name: pathParts[1],
        url: `https://github.com/${pathParts[0]}/${pathParts[1]}`,
        isValid: true,
      };
    }

    return {
      owner: '',
      name: '',
      url: '',
      isValid: false,
    };
  } catch (error) {
    return {
      owner: '',
      name: '',
      url: '',
      isValid: false,
    };
  }
}

// ============================================================================
// FILE UTILITIES
// ============================================================================

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export function getFileName(filePath: string): string {
  return path.basename(filePath);
}

export function isTestFile(filePath: string): boolean {
  const fileName = filePath.toLowerCase();
  return (
    fileName.includes('.test.') ||
    fileName.includes('.spec.') ||
    fileName.includes('__tests__') ||
    fileName.includes('/test/') ||
    fileName.includes('/tests/')
  );
}

export function isConfigFile(filePath: string): boolean {
  const fileName = path.basename(filePath).toLowerCase();
  const configPatterns = [
    'config',
    'configuration',
    '.rc',
    'package.json',
    'tsconfig',
    'webpack',
    'babel',
    'eslint',
    'prettier',
    '.env',
  ];

  return configPatterns.some((pattern) => fileName.includes(pattern));
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function estimateAnalysisTime(fileCount: number): number {
  // Simple estimation: ~100ms per file + 30s base overhead
  const baseTime = 30000; // 30 seconds
  const perFileTime = 100; // 100ms per file
  return baseTime + fileCount * perFileTime;
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFilePath(filePath: string): string {
  // Remove potential path traversal attempts
  return filePath.replace(/\.\./g, '').replace(/\/\//g, '/');
}

// ============================================================================
// RETRY UTILITIES
// ============================================================================

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = 2 } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await sleep(waitTime);
      }
    }
  }

  throw lastError!;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// PERCENTAGE CALCULATION
// ============================================================================

export function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}
