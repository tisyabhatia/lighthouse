import { useState, useEffect } from 'react';
import { analysisApi } from '../lib/api/analysis';
import type { FileTreeResponse } from '../lib/api/types';

export interface UseFileTreeResult {
  fileTree: FileTreeResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFileTree(analysisId: string | null): UseFileTreeResult {
  const [fileTree, setFileTree] = useState<FileTreeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFileTree = async () => {
    if (!analysisId) {
      setError('No analysis ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await analysisApi.getFileTree(analysisId);
      setFileTree(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch file tree');
      console.error('Error fetching file tree:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (analysisId) {
      fetchFileTree();
    }
  }, [analysisId]);

  return {
    fileTree,
    loading,
    error,
    refetch: fetchFileTree,
  };
}
