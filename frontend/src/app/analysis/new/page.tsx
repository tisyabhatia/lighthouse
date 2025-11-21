'use client';

import { useRouter } from 'next/navigation';
import { AnalysisForm } from '@/components/analysis/AnalysisForm';

export default function NewAnalysisPage() {
  const router = useRouter();

  const handleSuccess = (analysisId: string) => {
    router.push(`/analysis/${analysisId}`);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <AnalysisForm onSuccess={handleSuccess} />
        </div>
      </div>
    </main>
  );
}
