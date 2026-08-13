// Route Dashboard — di-mount di root (path sudah penuh), semua butuh auth:
//   GET /dashboard/summary      → ringkasan global user
//   GET /dashboard/active-jobs  → job aktif (pending/processing)
//   GET /dashboard/history      → riwayat job + filter
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { activeJobs, history, summary } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/dashboard/summary', authMiddleware, summary);
router.get('/dashboard/active-jobs', authMiddleware, activeJobs);
router.get('/dashboard/history', authMiddleware, history);

export default router;
