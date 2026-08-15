// Route Projects — di-mount di `/projects`, semua butuh auth:
//   GET    /projects          → list (page/limit)
//   POST   /projects          → buat (name + drive_account_id; otomatis buat folder Drive)
//   GET    /projects/:id      → detail + ringkasan status job
//   GET    /projects/:id/drive-files → list file di folder Drive project (real-time)
//   DELETE /projects/:id/drive-files/:fileId → hapus file permanen dari Google Drive
//   PATCH  /projects/:id      → rename
//   DELETE /projects/:id      → soft delete
import { Router } from 'express';
import * as projectsController from '../controllers/projects.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, projectsController.list);
router.post('/', authMiddleware, projectsController.create);
router.get('/:id', authMiddleware, projectsController.detail);
router.get('/:id/drive-files', authMiddleware, projectsController.driveFiles);
router.delete('/:id/drive-files/:fileId', authMiddleware, projectsController.deleteDriveFile);
router.patch('/:id', authMiddleware, projectsController.update);
router.delete('/:id', authMiddleware, projectsController.remove);

export default router;
