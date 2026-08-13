// Route Jobs — di-mount di root (path sudah penuh), semua butuh auth:
//   POST /projects/:projectId/jobs  → submit batch (maks 50 link)
//   GET  /projects/:projectId/jobs  → list job per project (status/page/limit)
//   GET  /jobs/:id                  → detail job
//   POST /jobs/:id/retry            → retry failed → pending
//   POST /jobs/:id/cancel           → cancel pending/processing
import { Router } from 'express';
import * as jobsController from '../controllers/jobs.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/projects/:projectId/jobs', authMiddleware, jobsController.createBatch);
router.get('/projects/:projectId/jobs', authMiddleware, jobsController.listJobs);
router.get('/jobs/:id', authMiddleware, jobsController.getJob);
router.post('/jobs/:id/retry', authMiddleware, jobsController.retryJob);
router.post('/jobs/:id/cancel', authMiddleware, jobsController.cancelJob);

export default router;
