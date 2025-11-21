export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

export const API_ENDPOINTS = {
  HEALTH: `/api/${API_VERSION}/health`,
  ANALYZE: `/api/${API_VERSION}/analyze`,
  ANALYSIS: (id: string) => `/api/${API_VERSION}/analysis/${id}`,
  ANALYSIS_STATUS: (id: string) => `/api/${API_VERSION}/analysis/${id}/status`,
  ANALYSIS_TREE: (id: string) => `/api/${API_VERSION}/analysis/${id}/tree`,
  ANALYSIS_DEPENDENCIES: (id: string) =>
    `/api/${API_VERSION}/analysis/${id}/dependencies`,
  ANALYSIS_SUMMARIES: (id: string) =>
    `/api/${API_VERSION}/analysis/${id}/summaries`,
  ANALYSIS_IMPACT: (id: string) =>
    `/api/${API_VERSION}/analysis/${id}/impact`,
  ANALYSIS_ONBOARDING: (id: string) =>
    `/api/${API_VERSION}/analysis/${id}/onboarding`,
  ANALYSES: `/api/${API_VERSION}/analyses`,
} as const;

export const POLLING_INTERVAL = 2000; // 2 seconds

export const JOB_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const STATUS_COLORS = {
  queued: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error',
  cancelled: 'default',
} as const;
