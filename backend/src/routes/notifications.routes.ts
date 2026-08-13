// Route Notifications — di-mount di root (path sudah penuh), semua butuh auth:
//   GET   /notifications              → list (?unread_only=true)
//   PATCH /notifications/:id/read     → tandai satu baca
//   PATCH /notifications/read-all     → tandai semua baca
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  listNotifications,
  markAllRead,
  markRead,
} from '../controllers/notifications.controller.js';

const router = Router();

router.get('/notifications', authMiddleware, listNotifications);
router.patch('/notifications/:id/read', authMiddleware, markRead);
router.patch('/notifications/read-all', authMiddleware, markAllRead);

export default router;
