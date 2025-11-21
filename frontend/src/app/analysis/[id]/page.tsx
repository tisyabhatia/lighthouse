'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ProgressTracker } from '@/components/analysis/ProgressTracker';

interface AnalysisPageProps {
  params: Promise<{ id: string }>;
}

export default function AnalysisPage({ params }: AnalysisPageProps) {
  const { id } = use(params);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="outline" size="sm">← Back to Home</Button>
            </Link>
            <h1 className="text-4xl font-bold mt-4 mb-2">Analysis Details</h1>
            <p className="text-muted-foreground">Analysis ID: {id}</p>
          </div>

          {/* Progress Tracker */}
          <div className="mb-8">
            <ProgressTracker
              analysisId={id}
              onComplete={() => setAnalysisComplete(true)}
            />
          </div>

          {/* Results (shown when complete) */}
          {analysisComplete && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Results</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Link href={`/analysis/${id}/tree`}>
                  <div className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <h3 className="text-xl font-semibold mb-2">📁 File Tree</h3>
                    <p className="text-muted-foreground">
                      Explore the repository structure
                    </p>
                  </div>
                </Link>

                <div className="border rounded-lg p-6 opacity-50">
                  <h3 className="text-xl font-semibold mb-2">🔗 Dependencies</h3>
                  <p className="text-muted-foreground">
                    Coming in Sprint 4
                  </p>
                </div>

                <div className="border rounded-lg p-6 opacity-50">
                  <h3 className="text-xl font-semibold mb-2">🤖 AI Summaries</h3>
                  <p className="text-muted-foreground">
                    Coming in Sprint 5
                  </p>
                </div>

                <div className="border rounded-lg p-6 opacity-50">
                  <h3 className="text-xl font-semibold mb-2">💥 Impact Analysis</h3>
                  <p className="text-muted-foreground">
                    Coming in Sprint 6
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
