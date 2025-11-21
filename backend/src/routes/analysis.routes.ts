import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { validateBody } from '../middleware/validation';
import { strictRateLimiter } from '../middleware/rate-limit';
import { createAnalysisSchema } from '../lib/validators';
import { parseGitHubUrl, generateAnalysisId, estimateAnalysisTime } from '../lib/utils';
import { addAnalysisJob, getJobStatus } from '../config/queue';
import { analysisRepository } from '../modules/storage/repository/analysis.repository';
import { githubService } from '../modules/github/github.service';
import { NotFoundError } from '../lib/errors';
import type { CreateAnalysisRequest, CreateAnalysisResponse, AnalysisStatusResponse } from '../types/api';

const router = Router();

// POST /api/v1/analyze - Create new analysis
router.post(
  '/',
  strictRateLimiter,
  validateBody(createAnalysisSchema),
  asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const body = req.body as CreateAnalysisRequest;

    // Parse GitHub URL
    const repoInfo = parseGitHubUrl(body.repository_url);
    if (!repoInfo.isValid) {
      return res.status(400).json({
        error: 'Invalid repository URL',
        message: 'Please provide a valid GitHub repository URL',
      });
    }

    // Verify repository access
    const hasAccess = await githubService.verifyAccess(repoInfo.owner, repoInfo.name);
    if (!hasAccess) {
      return res.status(404).json({
        error: 'Repository not found',
        message: `Repository ${repoInfo.owner}/${repoInfo.name} not found or not accessible`,
      });
    }

    // Get default branch if not specified
    let branch = body.branch;
    if (!branch) {
      branch = await githubService.detectDefaultBranch(repoInfo.owner, repoInfo.name);
    }

    // Create analysis record
    const analysisId = generateAnalysisId();
    await analysisRepository.create({
      id: analysisId,
      repositoryUrl: repoInfo.url,
      owner: repoInfo.owner,
      name: repoInfo.name,
      branch,
      options: {
        includeTests: body.options?.includeTests ?? true,
        maxFileSizeKB: body.options?.maxFileSizeKB ?? 1000,
        languages: body.options?.languages,
        excludePatterns: body.options?.excludePatterns,
        deepAnalysis: body.options?.deepAnalysis ?? false,
      },
    });

    // Add job to queue
    await addAnalysisJob({
      analysisId,
      repositoryUrl: repoInfo.url,
      branch,
      options: {
        includeTests: body.options?.includeTests ?? true,
        maxFileSizeKB: body.options?.maxFileSizeKB ?? 1000,
        languages: body.options?.languages,
        excludePatterns: body.options?.excludePatterns,
      },
    });

    const response: CreateAnalysisResponse = {
      analysis_id: analysisId,
      status: 'queued',
      created_at: new Date().toISOString(),
      estimated_time: estimateAnalysisTime(100), // Default estimate
    };

    res.status(201).json(response);
  })
);

// GET /api/v1/analysis/:id/status - Get analysis status
router.get(
  '/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Get analysis from database
    const analysis = await analysisRepository.findById(id);
    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    // Get job status from queue
    const jobStatus = await getJobStatus(id);

    const response: AnalysisStatusResponse = {
      analysis_id: id,
      status: analysis.status as any,
      progress: (jobStatus?.progress as any) || {
        currentStep: 'Waiting to start',
        percentage: 0,
        stepsCompleted: [],
        stepsTotal: 4,
      },
      error: analysis.error || undefined,
      completed_at: analysis.completedAt?.toISOString(),
    };

    res.json(response);
  })
);

// GET /api/v1/analyses - List all analyses
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as any;

    const { analyses, total } = await analysisRepository.list({
      limit,
      offset,
      status,
    });

    res.json({
      analyses: analyses.map((a: any) => ({
        analysis_id: a.id,
        repository_url: a.repositoryUrl,
        status: a.status,
        created_at: a.createdAt.toISOString(),
        completed_at: a.completedAt?.toISOString(),
      })),
      total,
      page: Math.floor(offset / limit) + 1,
    });
  })
);

// GET /api/v1/analysis/:id/tree - Get file tree
router.get(
  '/:id/tree',
  asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    const analysis = await analysisRepository.findById(id);
    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    if (!analysis.fileTree) {
      return res.status(404).json({
        error: 'File tree not found',
        message: 'Analysis has not completed file tree generation yet',
      });
    }

    res.json({
      root: analysis.fileTree.tree,
      statistics: {
        totalFiles: analysis.fileTree.totalFiles,
        totalDirectories: analysis.fileTree.totalDirectories,
        totalLines: analysis.fileTree.totalLines,
        languageBreakdown: analysis.fileTree.languageBreakdown,
        sizeBreakdown: {
          totalSize: Number(analysis.fileTree.totalSize),
          averageFileSize: Math.round(Number(analysis.fileTree.totalSize) / analysis.fileTree.totalFiles),
        },
      },
    });
  })
);

// DELETE /api/v1/analysis/:id - Delete analysis
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const success = await analysisRepository.delete(id);
    if (!success) {
      throw new NotFoundError('Analysis not found');
    }

    res.json({
      success: true,
      message: 'Analysis deleted successfully',
    });
  })
);

export default router;
