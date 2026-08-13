// Route DriveAccounts — di-mount di `/drive-accounts`, semua butuh auth (kecuali callback OAuth):
//   GET    /drive-accounts                 → list akun
//   GET    /drive-accounts/connect         → redirect consent Google Drive
//   GET    /drive-accounts/connect/callback → callback OAuth (tanpa auth; userId via state)
//   PATCH  /drive-accounts/:id/set-default → set default
//   DELETE /drive-accounts/:id             → putus koneksi (409 kalau dipakai project)
import { Router } from 'express';
import * as driveAccountsController from '../controllers/driveAccounts.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, driveAccountsController.list);
router.get('/connect', authMiddleware, driveAccountsController.connect);
router.get('/connect/callback', driveAccountsController.connectCallback);
router.patch('/:id/set-default', authMiddleware, driveAccountsController.setDefault);
router.delete('/:id', authMiddleware, driveAccountsController.remove);

export default router;
