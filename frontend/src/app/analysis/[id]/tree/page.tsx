'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFileTree } from '../../../../hooks/useFileTree';
import { FileTreeView } from '../../../../components/tree/FileTreeView';
import { TreeStatistics } from '../../../../components/tree/TreeStatistics';
import { Button } from '../../../../components/ui/Button';

export default function FileTreePage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;

  const { fileTree, loading, error } = useFileTree(analysisId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push(`/analysis/${analysisId}`)}
            className="mb-4"
          >
            ← Back to Analysis
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">File Tree Explorer</h1>
          <p className="mt-2 text-gray-600">
            Browse the repository structure and statistics
          </p>
        </div>

        {/* Statistics */}
        {fileTree?.statistics && (
          <div className="mb-6">
            <TreeStatistics statistics={fileTree.statistics} />
          </div>
        )}

        {/* File Tree */}
        <FileTreeView tree={fileTree?.tree!} loading={loading} error={error} />
      </div>
    </div>
  );
}
