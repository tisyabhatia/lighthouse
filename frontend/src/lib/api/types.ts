// Mirror backend types for frontend use

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface CreateAnalysisRequest {
  repository_url: string;
  branch?: string;
  options?: {
    includeTests?: boolean;
    maxFileSizeKB?: number;
    languages?: string[];
    excludePatterns?: string[];
    deepAnalysis?: boolean;
  };
}

export interface CreateAnalysisResponse {
  analysis_id: string;
  status: JobStatus;
  created_at: string;
  estimated_time: number;
}

export interface JobProgress {
  currentStep: string;
  percentage: number;
  stepsCompleted: string[];
  stepsTotal: number;
}

export interface AnalysisStatusResponse {
  analysis_id: string;
  status: JobStatus;
  progress: JobProgress;
  error?: string;
  completed_at?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: boolean;
    redis: boolean;
    queue: boolean;
  };
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: string;
}

export interface AnalysisListItem {
  analysis_id: string;
  repository_url: string;
  status: JobStatus;
  created_at: string;
  completed_at?: string;
}

export interface AnalysisListResponse {
  analyses: AnalysisListItem[];
  total: number;
  page: number;
}
