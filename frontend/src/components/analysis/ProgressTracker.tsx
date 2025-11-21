'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { analysisApi } from '@/lib/api/analysis';
import { POLLING_INTERVAL } from '@/lib/constants';
import type { AnalysisStatusResponse } from '@/lib/api/types';

interface ProgressTrackerProps {
  analysisId: string;
  onComplete?: () => void;
}

const STATUS_VARIANTS = {
  queued: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'destructive',
  cancelled: 'outline',
} as const;

export function ProgressTracker({ analysisId, onComplete }: ProgressTrackerProps) {
  const [status, setStatus] = useState<AnalysisStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const response = await analysisApi.getAnalysisStatus(analysisId);
        setStatus(response);
        setError('');

        // Stop polling if completed or failed
        if (response.status === 'completed' || response.status === 'failed') {
          if (intervalId) {
            clearInterval(intervalId);
          }
          if (response.status === 'completed' && onComplete) {
            onComplete();
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch status');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll for updates
    intervalId = setInterval(fetchStatus, POLLING_INTERVAL);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [analysisId, onComplete]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const statusVariant = STATUS_VARIANTS[status.status] || 'default';
  const isProcessing = status.status === 'processing' || status.status === 'queued';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Analysis Progress</CardTitle>
          <Badge variant={statusVariant as any}>{status.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isProcessing && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{status.progress.currentStep}</span>
                <span>{status.progress.percentage}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${status.progress.percentage}%` }}
                />
              </div>
            </div>

            {/* Steps Completed */}
            {status.progress.stepsCompleted.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Completed Steps:</h4>
                <ul className="space-y-1">
                  {status.progress.stepsCompleted.map((step, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {status.status === 'completed' && (
          <div className="text-center py-4">
            <p className="text-green-600 font-medium">✓ Analysis completed successfully!</p>
          </div>
        )}

        {status.status === 'failed' && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            <p className="font-medium">Analysis failed</p>
            {status.error && <p className="text-sm mt-2">{status.error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
