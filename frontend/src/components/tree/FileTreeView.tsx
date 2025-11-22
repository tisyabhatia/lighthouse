'use client';

import { FileTreeNode } from './FileTreeNode';
import type { FileTreeNode as FileTreeNodeType } from '../../lib/api/types';
import { Spinner } from '../ui/Spinner';

interface FileTreeViewProps {
  tree: FileTreeNodeType;
  loading?: boolean;
  error?: string | null;
}

export function FileTreeView({ tree, loading, error }: FileTreeViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600">Loading file tree...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-600 mr-2">⚠️</span>
          <p className="text-red-800 font-medium">Error loading file tree</p>
        </div>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900">File Tree</h3>
        <p className="text-sm text-gray-600 mt-1">
          Browse the repository structure
        </p>
      </div>
      <div className="p-4 max-h-[600px] overflow-y-auto">
        <FileTreeNode node={tree} />
      </div>
    </div>
  );
}
