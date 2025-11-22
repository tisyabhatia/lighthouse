'use client';

import type { FileTreeStatistics } from '../../lib/api/types';

interface TreeStatisticsProps {
  statistics: FileTreeStatistics;
}

export function TreeStatistics({ statistics }: TreeStatisticsProps) {
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Get top languages sorted by file count
  const topLanguages = Object.entries(statistics.languageBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const totalFilesByLanguage = Object.values(statistics.languageBreakdown).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Repository Statistics</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-blue-600 text-sm font-medium mb-1">Total Files</div>
          <div className="text-2xl font-bold text-blue-900">
            {formatNumber(statistics.totalFiles)}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-green-600 text-sm font-medium mb-1">Directories</div>
          <div className="text-2xl font-bold text-green-900">
            {formatNumber(statistics.totalDirectories)}
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-purple-600 text-sm font-medium mb-1">Lines of Code</div>
          <div className="text-2xl font-bold text-purple-900">
            {formatNumber(statistics.totalLines)}
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-orange-600 text-sm font-medium mb-1">Total Size</div>
          <div className="text-2xl font-bold text-orange-900">
            {formatSize(statistics.totalSize)}
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">Language Distribution</h4>
        <div className="space-y-2">
          {topLanguages.length > 0 ? (
            topLanguages.map(([language, count]) => {
              const percentage = ((count / totalFilesByLanguage) * 100).toFixed(1);
              return (
                <div key={language}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 capitalize">
                      {language}
                    </span>
                    <span className="text-gray-600">
                      {count} files ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-sm">No language data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
