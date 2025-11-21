import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { validateBody } from '../middleware/validation';
import { strictRateLimiter } from '../middleware/rate-limit';
import { createAnalysisSchema } from '../lib/validators';

const router = Router();

// Placeholder for POST /api/v1/analyze
// This will be fully implemented in Sprint 2
router.post(
  '/',
  strictRateLimiter,
  validateBody(createAnalysisSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement in Sprint 2
    res.status(501).json({
      message: 'Analysis creation not yet implemented',
      note: 'This endpoint will be available in Sprint 2',
    });
  })
);

// Placeholder for GET /api/v1/analysis/:id/status
router.get(
  '/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement in Sprint 2
    res.status(501).json({
      message: 'Analysis status not yet implemented',
      note: 'This endpoint will be available in Sprint 2',
    });
  })
);

export default router;
