import { z } from 'zod';

// ============================================================================
// REQUEST VALIDATORS
// ============================================================================

export const createAnalysisSchema = z.object({
  repository_url: z
    .string()
    .url('Invalid repository URL')
    .regex(/github\.com/, 'Only GitHub repositories are supported'),
  branch: z.string().optional(),
  options: z
    .object({
      includeTests: z.boolean().optional(),
      maxFileSizeKB: z.number().min(1).max(10000).optional(),
      languages: z.array(z.string()).optional(),
      excludePatterns: z.array(z.string()).optional(),
      deepAnalysis: z.boolean().optional(),
    })
    .optional(),
});

export const analysisIdSchema = z.object({
  analysis_id: z.string().min(1, 'Analysis ID is required'),
});

export const getFileTreeSchema = z.object({
  analysis_id: z.string().min(1),
  depth: z.number().min(1).max(20).optional(),
});

export const getDependenciesSchema = z.object({
  analysis_id: z.string().min(1),
  level: z.enum(['file', 'function']).optional(),
  format: z.enum(['nodes_edges', 'adjacency']).optional(),
});

export const getSummariesSchema = z.object({
  analysis_id: z.string().min(1),
  file_path: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export const getImpactAnalysisSchema = z.object({
  analysis_id: z.string().min(1),
  file_path: z.string().optional(),
});

export const getOnboardingGuideSchema = z.object({
  analysis_id: z.string().min(1),
  role: z.enum(['frontend', 'backend', 'fullstack']).optional(),
});

export const getCompleteAnalysisSchema = z.object({
  analysis_id: z.string().min(1),
  include: z.string().optional(),
});

export const listAnalysesSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  status: z
    .enum(['queued', 'processing', 'completed', 'failed', 'cancelled'])
    .optional(),
});

// ============================================================================
// VALIDATOR HELPER TYPES
// ============================================================================

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;
export type AnalysisIdInput = z.infer<typeof analysisIdSchema>;
export type GetFileTreeInput = z.infer<typeof getFileTreeSchema>;
export type GetDependenciesInput = z.infer<typeof getDependenciesSchema>;
export type GetSummariesInput = z.infer<typeof getSummariesSchema>;
export type GetImpactAnalysisInput = z.infer<typeof getImpactAnalysisSchema>;
export type GetOnboardingGuideInput = z.infer<typeof getOnboardingGuideSchema>;
export type GetCompleteAnalysisInput = z.infer<typeof getCompleteAnalysisSchema>;
export type ListAnalysesInput = z.infer<typeof listAnalysesSchema>;

// ============================================================================
// VALIDATION HELPER FUNCTION
// ============================================================================

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
