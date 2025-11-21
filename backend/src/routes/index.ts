import { Router } from 'express';
import healthRoutes from './health.routes';
// Future route imports will go here
// import analysisRoutes from './analysis.routes';

const router = Router();

// Mount routes
router.use('/', healthRoutes);
// Future routes will be mounted here
// router.use('/analyze', analysisRoutes);

export default router;
