import { AnalysisOptions } from './models';

// ============================================================================
// QUEUE JOB TYPES
// ============================================================================

export interface AnalysisJobData {
  analysisId: string;
  repositoryUrl: string;
  branch: string;
  options: AnalysisOptions;
}

export interface JobProgressData {
  currentStep: string;
  percentage: number;
  stepsCompleted: string[];
  stepsTotal: number;
}

export enum AnalysisStep {
  CLONING = 'Cloning repository',
  BUILDING_TREE = 'Building file tree',
  PARSING_FILES = 'Parsing source files',
  BUILDING_GRAPH = 'Building dependency graph',
  GENERATING_SUMMARIES = 'Generating AI summaries',
  ANALYZING_IMPACT = 'Analyzing impact',
  GENERATING_ONBOARDING = 'Generating onboarding guide',
  FINALIZING = 'Finalizing analysis',
}

export interface JobResult {
  analysisId: string;
  status: 'completed' | 'failed';
  error?: string;
  completedAt: Date;
}
