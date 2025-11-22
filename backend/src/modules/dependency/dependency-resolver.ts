import * as path from 'path';
import * as fs from 'fs/promises';

export interface ResolvedImport {
  originalImport: string;
  resolvedPath: string | null;
  isExternal: boolean;
  isResolved: boolean;
}

export class DependencyResolver {
  private projectRoot: string;
  private fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.json'];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Resolve an import path to an actual file path
   */
  async resolveImportPath(
    importSource: string,
    currentFilePath: string
  ): Promise<ResolvedImport> {
    // Check if it's an external package (node_modules)
    if (this.isExternalPackage(importSource)) {
      return {
        originalImport: importSource,
        resolvedPath: null,
        isExternal: true,
        isResolved: false,
      };
    }

    // Resolve relative or absolute import
    const resolvedPath = await this.resolveLocalImport(importSource, currentFilePath);

    return {
      originalImport: importSource,
      resolvedPath,
      isExternal: false,
      isResolved: resolvedPath !== null,
    };
  }

  /**
   * Check if import is an external package
   */
  private isExternalPackage(importSource: string): boolean {
    // Starts with a package name (no ./ or ../ or /)
    if (importSource.startsWith('.') || importSource.startsWith('/')) {
      return false;
    }

    // Check for scoped packages (@scope/package)
    if (importSource.startsWith('@')) {
      return true;
    }

    // Check for built-in Node.js modules
    const builtinModules = [
      'fs',
      'path',
      'http',
      'https',
      'crypto',
      'util',
      'stream',
      'events',
      'buffer',
      'process',
      'os',
      'child_process',
      'cluster',
      'net',
      'url',
      'querystring',
      'zlib',
    ];

    if (builtinModules.includes(importSource)) {
      return true;
    }

    // Otherwise, it's a package name
    return !importSource.includes('/') || !importSource.startsWith('.');
  }

  /**
   * Resolve a local import to a file path
   */
  private async resolveLocalImport(
    importSource: string,
    currentFilePath: string
  ): Promise<string | null> {
    const currentDir = path.dirname(currentFilePath);

    // Build the base path
    let basePath: string;

    if (importSource.startsWith('.')) {
      // Relative import
      basePath = path.resolve(currentDir, importSource);
    } else if (importSource.startsWith('/')) {
      // Absolute import from project root
      basePath = path.resolve(this.projectRoot, importSource.substring(1));
    } else {
      // Could be a path alias (e.g., @/components)
      // For now, treat it as relative to project root
      basePath = path.resolve(this.projectRoot, importSource);
    }

    // Try to resolve with different extensions
    const resolved = await this.tryResolveWithExtensions(basePath);
    if (resolved) {
      return this.makeRelativeToProject(resolved);
    }

    // Try to resolve as directory (index file)
    const indexResolved = await this.tryResolveAsDirectory(basePath);
    if (indexResolved) {
      return this.makeRelativeToProject(indexResolved);
    }

    return null;
  }

  /**
   * Try to resolve a path with different file extensions
   */
  private async tryResolveWithExtensions(basePath: string): Promise<string | null> {
    // Try exact path first
    if (await this.fileExists(basePath)) {
      return basePath;
    }

    // Try with extensions
    for (const ext of this.fileExtensions) {
      const pathWithExt = basePath + ext;
      if (await this.fileExists(pathWithExt)) {
        return pathWithExt;
      }
    }

    return null;
  }

  /**
   * Try to resolve as a directory (looking for index files)
   */
  private async tryResolveAsDirectory(dirPath: string): Promise<string | null> {
    // Check if it's a directory
    try {
      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        return null;
      }
    } catch {
      return null;
    }

    // Try different index file names
    const indexNames = ['index', '__init__']; // JS/TS and Python

    for (const indexName of indexNames) {
      for (const ext of this.fileExtensions) {
        const indexPath = path.join(dirPath, indexName + ext);
        if (await this.fileExists(indexPath)) {
          return indexPath;
        }
      }
    }

    return null;
  }

  /**
   * Check if a file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Make path relative to project root
   */
  private makeRelativeToProject(absolutePath: string): string {
    return path.relative(this.projectRoot, absolutePath);
  }

  /**
   * Resolve all imports for a parsed file
   */
  async resolveImports(
    imports: Array<{ source: string }>,
    currentFilePath: string
  ): Promise<ResolvedImport[]> {
    const results: ResolvedImport[] = [];

    for (const imp of imports) {
      const resolved = await this.resolveImportPath(imp.source, currentFilePath);
      results.push(resolved);
    }

    return results;
  }

  /**
   * Build a dependency map for multiple files
   */
  async buildDependencyMap(
    parsedFiles: Array<{ path: string; imports: Array<{ source: string }> }>
  ): Promise<Map<string, ResolvedImport[]>> {
    const dependencyMap = new Map<string, ResolvedImport[]>();

    for (const file of parsedFiles) {
      const resolvedImports = await this.resolveImports(file.imports, file.path);
      dependencyMap.set(file.path, resolvedImports);
    }

    return dependencyMap;
  }
}

/**
 * Create a dependency resolver for a project
 */
export function createDependencyResolver(projectRoot: string): DependencyResolver {
  return new DependencyResolver(projectRoot);
}
