// Route Auth — di-mount di `/auth`:
//   GET  /auth/google        → redirect consent Google
//   GET  /auth/google/callback → callback OAuth (buat user + JWT)
//   POST /auth/logout        → 204
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.get('/google', authController.google);
router.get('/google/callback', authController.callback);
router.post('/logout', authController.logout);

export default router;
