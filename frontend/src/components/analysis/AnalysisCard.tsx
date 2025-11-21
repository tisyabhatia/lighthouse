'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatDate } from '@/lib/utils';
import type { AnalysisListItem } from '@/lib/api/types';

interface AnalysisCardProps {
  analysis: AnalysisListItem;
}

const STATUS_VARIANTS = {
  queued: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'destructive',
  cancelled: 'outline',
} as const;

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const statusVariant = STATUS_VARIANTS[analysis.status] || 'default';

  return (
    <Link href={`/analysis/${analysis.analysis_id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">
                {analysis.repository_url.replace('https://github.com/', '')}
              </CardTitle>
              <CardDescription className="mt-1">
                Created {formatDate(analysis.created_at)}
              </CardDescription>
            </div>
            <Badge variant={statusVariant as any} className="ml-2">
              {analysis.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {analysis.completed_at ? (
              <p>Completed {formatDate(analysis.completed_at)}</p>
            ) : (
              <p>In progress...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
