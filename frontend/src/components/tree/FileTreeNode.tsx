'use client';

import { useState } from 'react';
import type { FileTreeNode as FileTreeNodeType } from '../../lib/api/types';

interface FileTreeNodeProps {
  node: FileTreeNodeType;
  level?: number;
}

export function FileTreeNode({ node, level = 0 }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const hasChildren = node.children && node.children.length > 0;
  const indent = level * 20;

  const getFileIcon = () => {
    if (node.type === 'directory') {
      return isExpanded ? '📂' : '📁';
    }

    // Return icon based on file extension
    const ext = node.metadata?.extension || '';
    const iconMap: Record<string, string> = {
      '.ts': '🔷',
      '.tsx': '⚛️',
      '.js': '🟨',
      '.jsx': '⚛️',
      '.py': '🐍',
      '.java': '☕',
      '.go': '🐹',
      '.rs': '🦀',
      '.rb': '💎',
      '.php': '🐘',
      '.swift': '🦅',
      '.md': '📝',
      '.json': '📋',
      '.yml': '⚙️',
      '.yaml': '⚙️',
      '.toml': '⚙️',
      '.xml': '📋',
      '.css': '🎨',
      '.scss': '🎨',
      '.html': '🌐',
    };

    return iconMap[ext] || '📄';
  };

  const getLanguageColor = () => {
    const lang = node.metadata?.language || '';
    const colorMap: Record<string, string> = {
      typescript: 'text-blue-600',
      javascript: 'text-yellow-600',
      python: 'text-green-600',
      java: 'text-red-600',
      go: 'text-cyan-600',
      rust: 'text-orange-600',
      ruby: 'text-red-500',
      php: 'text-purple-600',
      swift: 'text-orange-500',
    };

    return colorMap[lang] || 'text-gray-600';
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer rounded transition-colors ${
          node.type === 'directory' ? 'font-medium' : ''
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        <span className="mr-2 text-lg">{getFileIcon()}</span>
        <span className={`flex-1 ${getLanguageColor()}`}>{node.name}</span>
        {node.metadata && (
          <span className="text-xs text-gray-500 ml-2">
            {node.metadata.linesOfCode > 0 && (
              <span className="mr-3">{node.metadata.linesOfCode} lines</span>
            )}
            {node.metadata.size > 0 && (
              <span>{formatSize(node.metadata.size)}</span>
            )}
          </span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <FileTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
