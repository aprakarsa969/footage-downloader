// Route Dashboard — di-mount di root (path sudah penuh), semua butuh auth:
//   GET    /dashboard/summary      → ringkasan global user
//   GET    /dashboard/active-jobs  → job aktif (pending/processing)
//   GET    /dashboard/history      → riwayat job + filter
//   DELETE /dashboard/history/:id  → hapus 1 item riwayat
//   DELETE /dashboard/history      → hapus semua riwayat selesai/gagal
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validateRequest.middleware.js';
import { activeJobs, clearHistory, deleteHistoryItem, history, summary } from '../controllers/dashboard.controller.js';
import { historyQuerySchema } from '../schemas/dashboard.schema.js';

const router = Router();

router.get('/dashboard/summary', authMiddleware, summary);
router.get('/dashboard/active-jobs', authMiddleware, activeJobs);
router.get('/dashboard/history', authMiddleware, validate({ query: historyQuerySchema }), history);
router.delete('/dashboard/history/:id', authMiddleware, deleteHistoryItem);
router.delete('/dashboard/history', authMiddleware, clearHistory);

export default router;
