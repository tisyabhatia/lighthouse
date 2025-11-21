import path from 'path';
import fs from 'fs-extra';
import { logger } from '../../lib/logger';
import { generateId } from '../../lib/utils';
import { fileScannerService } from './file-scanner.service';
import type { FileTreeNode, FileMetadata } from '../../types/models';

class TreeBuilderService {
  /**
   * Build complete file tree from repository
   */
  async buildFileTree(
    rootPath: string,
    options: {
      excludePatterns?: string[];
      maxFileSizeKB?: number;
      includeTests?: boolean;
    } = {}
  ): Promise<FileTreeNode> {
    try {
      logger.info(`Building file tree for ${rootPath}`);

      const rootName = path.basename(rootPath);
      const tree = await this.buildTreeRecursive(rootPath, rootPath, options);

      return {
        id: generateId('node'),
        name: rootName,
        type: 'directory',
        path: rootPath,
        relativePath: '',
        children: tree.children,
      };
    } catch (error) {
      logger.error('Error building file tree:', error);
      throw error;
    }
  }

  /**
   * Recursively build tree structure
   */
  private async buildTreeRecursive(
    currentPath: string,
    rootPath: string,
    options: {
      excludePatterns?: string[];
      maxFileSizeKB?: number;
      includeTests?: boolean;
    }
  ): Promise<FileTreeNode> {
    const stats = await fs.stat(currentPath);
    const name = path.basename(currentPath);
    const relativePath = path.relative(rootPath, currentPath);

    // Base node
    const node: FileTreeNode = {
      id: generateId('node'),
      name,
      type: stats.isDirectory() ? 'directory' : 'file',
      path: currentPath,
      relativePath: relativePath || '.',
    };

    if (stats.isFile()) {
      // Add file metadata
      const metadata = await fileScannerService.getFileMetadata(currentPath);
      if (metadata) {
        const linesOfCode = await fileScannerService.countLines(currentPath);
        node.metadata = {
          ...metadata,
          linesOfCode,
        };
      }
    } else if (stats.isDirectory()) {
      // Skip certain directories
      if (this.shouldSkipDirectory(name)) {
        return node;
      }

      // Recursively process children
      const children: FileTreeNode[] = [];
      const entries = await fs.readdir(currentPath);

      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry);

        try {
          const childNode = await this.buildTreeRecursive(entryPath, rootPath, options);

          // Filter based on options
          if (childNode.type === 'file') {
            // Check file size
            if (childNode.metadata && options.maxFileSizeKB) {
              const sizeKB = childNode.metadata.size / 1024;
              if (sizeKB > options.maxFileSizeKB) {
                continue;
              }
            }

            // Check if test file
            if (!options.includeTests && childNode.metadata?.isTest) {
              continue;
            }
          }

          children.push(childNode);
        } catch (error) {
          logger.warn(`Error processing ${entryPath}:`, error);
        }
      }

      // Sort children: directories first, then files, both alphabetically
      children.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
      });

      node.children = children;
    }

    return node;
  }

  /**
   * Check if directory should be skipped
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.next',
      '.nuxt',
      'out',
      'vendor',
      '__pycache__',
      '.venv',
      'venv',
      'target',
      'bin',
      'obj',
      '.idea',
      '.vscode',
    ];

    return skipDirs.includes(dirName);
  }

  /**
   * Flatten tree to list of files
   */
  flattenTree(tree: FileTreeNode): FileTreeNode[] {
    const files: FileTreeNode[] = [];

    const traverse = (node: FileTreeNode) => {
      if (node.type === 'file') {
        files.push(node);
      }

      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(tree);
    return files;
  }

  /**
   * Get tree depth
   */
  getTreeDepth(tree: FileTreeNode, currentDepth: number = 0): number {
    if (!tree.children || tree.children.length === 0) {
      return currentDepth;
    }

    let maxDepth = currentDepth;
    for (const child of tree.children) {
      const childDepth = this.getTreeDepth(child, currentDepth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    }

    return maxDepth;
  }
}

export const treeBuilderService = new TreeBuilderService();
