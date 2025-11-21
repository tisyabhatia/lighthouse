import {
  JobStatus,
  JobProgress,
  FileTreeNode,
  FileTreeStatistics,
  GraphNode,
  GraphEdge,
  GraphMetadata,
  Summary,
  CriticalFile,
  FileImpact,
  ChangeHotspot,
  ProjectOverview,
  EntryPoint,
  ReadingStep,
  KeyDirectory,
  SetupInstructions,
  CommonTask,
  AnalysisOptions,
} from './models';

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export interface CreateAnalysisRequest {
  repository_url: string;
  branch?: string;
  options?: Partial<AnalysisOptions>;
}

export interface GetAnalysisStatusRequest {
  analysis_id: string;
}

export interface GetFileTreeRequest {
  analysis_id: string;
  depth?: number;
}

export interface GetDependenciesRequest {
  analysis_id: string;
  level?: 'file' | 'function';
  format?: 'nodes_edges' | 'adjacency';
}

export interface GetSummariesRequest {
  analysis_id: string;
  file_path?: string;
  limit?: number;
  offset?: number;
}

export interface GetImpactAnalysisRequest {
  analysis_id: string;
  file_path?: string;
}

export interface GetOnboardingGuideRequest {
  analysis_id: string;
  role?: 'frontend' | 'backend' | 'fullstack';
}

export interface GetCompleteAnalysisRequest {
  analysis_id: string;
  include?: string; // comma-separated: 'tree,dependencies,summaries,impact,onboarding'
}

export interface ListAnalysesRequest {
  limit?: number;
  offset?: number;
  status?: JobStatus;
}

export interface DeleteAnalysisRequest {
  analysis_id: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface CreateAnalysisResponse {
  analysis_id: string;
  status: JobStatus;
  created_at: string;
  estimated_time: number;
}

export interface AnalysisStatusResponse {
  analysis_id: string;
  status: JobStatus;
  progress: JobProgress;
  error?: string;
  completed_at?: string;
}

export interface FileTreeResponse {
  root: FileTreeNode;
  statistics: FileTreeStatistics;
}

export interface DependencyGraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: GraphMetadata;
}

export interface SummariesResponse {
  summaries: Summary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ImpactAnalysisResponse {
  critical_files: CriticalFile[];
  impact_matrix: Record<string, FileImpact>;
  change_hotspots: ChangeHotspot[];
}

export interface OnboardingGuideResponse {
  overview: ProjectOverview;
  entry_points: EntryPoint[];
  reading_order: ReadingStep[];
  key_directories: KeyDirectory[];
  setup_instructions: SetupInstructions;
  common_tasks: CommonTask[];
}

export interface CompleteAnalysisResponse {
  analysis_id: string;
  repository: {
    url: string;
    branch: string;
    commit_sha: string;
    analyzed_at: string;
  };
  tree?: FileTreeResponse;
  dependencies?: DependencyGraphResponse;
  summaries?: SummariesResponse;
  impact?: ImpactAnalysisResponse;
  onboarding?: OnboardingGuideResponse;
}

export interface AnalysisListResponse {
  analyses: Array<{
    analysis_id: string;
    repository_url: string;
    status: JobStatus;
    created_at: string;
    completed_at?: string;
  }>;
  total: number;
  page: number;
}

export interface DeleteAnalysisResponse {
  success: boolean;
  message: string;
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

// ============================================================================
// ERROR RESPONSE TYPE
// ============================================================================

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: string;
}
