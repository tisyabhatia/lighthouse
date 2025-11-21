// ============================================================================
// CORE MODELS
// ============================================================================

export interface RepoMetadata {
  url: string;
  owner: string;
  name: string;
  branch: string;
  commitSha: string;
  clonedAt: Date;
  localPath: string;
  size: number; // bytes
}

export interface FileTreeNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  relativePath: string;
  children?: FileTreeNode[];
  metadata?: FileMetadata;
}

export interface FileMetadata {
  language: string;
  extension: string;
  size: number; // bytes
  linesOfCode: number;
  isTest: boolean;
  isConfig: boolean;
  lastModified: Date;
}

export interface FileTreeStatistics {
  totalFiles: number;
  totalDirectories: number;
  totalLines: number;
  languageBreakdown: Record<string, number>;
  sizeBreakdown: {
    totalSize: number;
    averageFileSize: number;
  };
}

// ============================================================================
// PARSER MODELS
// ============================================================================

export interface ParsedFile {
  id: string;
  path: string;
  language: string;
  ast: ASTNode | null;
  imports: Import[];
  exports: Export[];
  functions: FunctionDeclaration[];
  classes: ClassDeclaration[];
  variables: VariableDeclaration[];
  parseError?: string;
}

export interface ASTNode {
  type: string;
  start: number;
  end: number;
  loc: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  [key: string]: any;
}

export interface Import {
  source: string; // module path
  specifiers: string[]; // imported names
  importType: 'named' | 'default' | 'namespace';
  resolvedPath?: string; // absolute file path if local
  isExternal: boolean;
  line: number;
}

export interface Export {
  name: string;
  type: 'named' | 'default';
  line: number;
}

export interface FunctionDeclaration {
  id: string;
  name: string;
  params: string[];
  line: number;
  endLine: number;
  complexity: number; // cyclomatic complexity
  async: boolean;
  generator: boolean;
  callsTo: string[]; // function names called within
}

export interface ClassDeclaration {
  id: string;
  name: string;
  extends?: string;
  implements?: string[];
  methods: FunctionDeclaration[];
  properties: string[];
  line: number;
  endLine: number;
}

export interface VariableDeclaration {
  name: string;
  kind: 'const' | 'let' | 'var';
  line: number;
}

// ============================================================================
// DEPENDENCY GRAPH MODELS
// ============================================================================

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'file' | 'function' | 'class' | 'module';
  path: string;
  metadata: {
    linesOfCode: number;
    complexity: number;
    language: string;
    isEntryPoint?: boolean;
  };
}

export interface GraphEdge {
  id: string;
  source: string; // node id
  target: string; // node id
  type: 'imports' | 'calls' | 'extends' | 'implements';
  weight: number;
  line?: number;
}

export interface GraphMetadata {
  cyclicDependencies: string[][]; // array of cycles (node id arrays)
  maxDepth: number;
  couplingScore: number;
  cohesionScore: number;
  totalNodes: number;
  totalEdges: number;
}

export interface DependencyMetrics {
  afferentCoupling: number; // incoming dependencies
  efferentCoupling: number; // outgoing dependencies
  instability: number; // efferent / (afferent + efferent)
  fanIn: number;
  fanOut: number;
}

// ============================================================================
// AI SUMMARY MODELS
// ============================================================================

export interface Summary {
  id: string;
  type: 'file' | 'function' | 'class';
  path: string;
  name: string;
  summary: string;
  purpose: string;
  keyConcepts: string[];
  complexity: 'low' | 'medium' | 'high';
  lineStart: number;
  lineEnd: number;
  tokensUsed?: number;
  generatedAt: Date;
}

export interface AIBatchRequest {
  items: Array<{
    id: string;
    type: 'file' | 'function';
    content: string;
    context?: string;
  }>;
}

export interface AIBatchResponse {
  results: Summary[];
  tokensUsed: number;
  errors: Array<{ id: string; error: string }>;
}

// ============================================================================
// IMPACT ANALYSIS MODELS
// ============================================================================

export interface ImpactAnalysis {
  criticalFiles: CriticalFile[];
  impactMatrix: Record<string, FileImpact>;
  changeHotspots: ChangeHotspot[];
}

export interface CriticalFile {
  path: string;
  importanceScore: number; // 0-100
  dependentFilesCount: number;
  blastRadius: number;
  reasons: string[];
  metrics: {
    fanIn: number;
    fanOut: number;
    cyclomaticComplexity: number;
    centrality: number;
  };
}

export interface FileImpact {
  path: string;
  directDependents: string[];
  transitiveDependents: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  blastRadius: number;
}

export interface ChangeHotspot {
  path: string;
  changeFrequency: number; // from git history
  churnRate: number; // lines changed / total lines
  lastModified: Date;
}

export interface BlastRadiusResult {
  originFile: string;
  affectedFiles: string[];
  affectedCount: number;
  impactLayers: Array<{
    layer: number;
    files: string[];
  }>;
}

// ============================================================================
// ONBOARDING GUIDE MODELS
// ============================================================================

export interface OnboardingGuide {
  overview: ProjectOverview;
  entryPoints: EntryPoint[];
  readingOrder: ReadingStep[];
  keyDirectories: KeyDirectory[];
  setupInstructions: SetupInstructions;
  commonTasks: CommonTask[];
  glossary?: Record<string, string>;
}

export interface ProjectOverview {
  projectDescription: string;
  techStack: string[];
  architecturePattern: string;
  keyFeatures: string[];
  estimatedReadingTime: string;
}

export interface EntryPoint {
  file: string;
  type: 'main' | 'server' | 'cli' | 'config' | 'test';
  description: string;
  importance: 'critical' | 'important' | 'supporting';
}

export interface ReadingStep {
  step: number;
  title: string;
  files: string[];
  focus: string;
  estimatedTime: string;
  prerequisites?: number[]; // previous step numbers
}

export interface KeyDirectory {
  path: string;
  purpose: string;
  importance: 'critical' | 'important' | 'supporting';
  fileCount: number;
}

export interface SetupInstructions {
  prerequisites: string[];
  installationSteps: string[];
  environmentVariables: Array<{
    name: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }>;
  testCommands: string[];
}

export interface CommonTask {
  task: string;
  filesToModify: string[];
  steps: string[];
  estimatedTime: string;
}

// ============================================================================
// JOB & QUEUE MODELS
// ============================================================================

export interface AnalysisJob {
  id: string;
  repositoryUrl: string;
  branch: string;
  options: AnalysisOptions;
  status: JobStatus;
  progress: JobProgress;
  result?: Analysis;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AnalysisOptions {
  includeTests: boolean;
  maxFileSizeKB: number;
  languages?: string[];
  excludePatterns?: string[];
  deepAnalysis?: boolean;
}

export type JobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface JobProgress {
  currentStep: string;
  percentage: number;
  stepsCompleted: string[];
  stepsTotal: number;
}

// ============================================================================
// COMPLETE ANALYSIS RESULT
// ============================================================================

export interface Analysis {
  id: string;
  repository: RepoMetadata;
  fileTree: {
    root: FileTreeNode;
    statistics: FileTreeStatistics;
  };
  dependencies: DependencyGraph;
  summaries: Summary[];
  impact: ImpactAnalysis;
  onboarding: OnboardingGuide;
  analyzedAt: Date;
}
