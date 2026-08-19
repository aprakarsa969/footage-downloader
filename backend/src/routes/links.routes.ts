// Route Links — di-mount di `/links`:
//   POST /links/validate → validasi array URL (maks 20)
import { Router } from 'express';
import * as linksController from '../controllers/links.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validateRequest.middleware.js';
import { validateLinksSchema } from '../schemas/links.schema.js';

const router = Router();

router.post('/validate', authMiddleware, validate({ body: validateLinksSchema }), linksController.validate);

export default router;
