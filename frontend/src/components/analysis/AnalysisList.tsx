'use client';

import { useEffect, useState } from 'react';
import { AnalysisCard } from './AnalysisCard';
import { Spinner } from '../ui/Spinner';
import { analysisApi } from '@/lib/api/analysis';
import type { AnalysisListItem } from '@/lib/api/types';

interface AnalysesListProps {
  refreshTrigger?: number;
}

export function AnalysesList({ refreshTrigger }: AnalysesListProps) {
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalyses();
  }, [refreshTrigger]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await analysisApi.listAnalyses();
      setAnalyses(response.analyses);
    } catch (err: any) {
      setError(err.message || 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-md">
        {error}
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No analyses yet. Create your first analysis to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {analyses.map((analysis) => (
        <AnalysisCard key={analysis.analysis_id} analysis={analysis} />
      ))}
    </div>
  );
}
