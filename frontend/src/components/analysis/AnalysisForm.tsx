'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { analysisApi } from '@/lib/api/analysis';
import type { CreateAnalysisRequest } from '@/lib/api/types';

interface AnalysisFormProps {
  onSuccess?: (analysisId: string) => void;
  onError?: (error: string) => void;
}

export function AnalysisForm({ onSuccess, onError }: AnalysisFormProps) {
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [includeTests, setIncludeTests] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate URL
      if (!repositoryUrl.trim()) {
        throw new Error('Please enter a repository URL');
      }

      if (!repositoryUrl.includes('github.com')) {
        throw new Error('Only GitHub repositories are supported');
      }

      const requestData: CreateAnalysisRequest = {
        repository_url: repositoryUrl.trim(),
        branch: branch.trim() || undefined,
        options: {
          includeTests,
          maxFileSizeKB: 1000,
        },
      };

      const response = await analysisApi.createAnalysis(requestData);

      // Success
      if (onSuccess) {
        onSuccess(response.analysis_id);
      }

      // Reset form
      setRepositoryUrl('');
      setBranch('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create analysis';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyze GitHub Repository</CardTitle>
        <CardDescription>
          Enter a GitHub repository URL to start the analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="repo-url" className="block text-sm font-medium mb-2">
              Repository URL <span className="text-destructive">*</span>
            </label>
            <Input
              id="repo-url"
              type="url"
              placeholder="https://github.com/owner/repository"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Example: https://github.com/facebook/react
            </p>
          </div>

          <div>
            <label htmlFor="branch" className="block text-sm font-medium mb-2">
              Branch (optional)
            </label>
            <Input
              id="branch"
              type="text"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use the default branch
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="include-tests"
              type="checkbox"
              checked={includeTests}
              onChange={(e) => setIncludeTests(e.target.checked)}
              disabled={loading}
              className="h-4 w-4"
            />
            <label htmlFor="include-tests" className="text-sm font-medium">
              Include test files in analysis
            </label>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating Analysis...' : 'Start Analysis'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
