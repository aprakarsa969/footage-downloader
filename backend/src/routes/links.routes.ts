// Route Links — di-mount di `/links`:
//   POST /links/validate → validasi array URL (maks 20)
import { Router } from 'express';
import * as linksController from '../controllers/links.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/validate', authMiddleware, linksController.validate);

export default router;
