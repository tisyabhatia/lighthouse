import { Router } from 'express';
import healthRoutes from './health.routes';
import analysisRoutes from './analysis.routes';

const router = Router();

// Mount routes
router.use('/', healthRoutes);
router.use('/analyze', analysisRoutes);
router.use('/analysis', analysisRoutes);
router.use('/analyses', analysisRoutes);

export default router;
