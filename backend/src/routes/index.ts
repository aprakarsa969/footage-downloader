// Registrasi semua route. Dua pola mount:
// - Prefix: auth, drive-accounts, links, projects → path router belum penuh → mount di prefix.
// - Full path: dashboard, jobs, notifications → path router sudah penuh → mount langsung di root.
import { Router } from 'express';
import authRouter from './auth.routes.js';
import dashboardRouter from './dashboard.routes.js';
import driveAccountsRouter from './driveAccounts.routes.js';
import jobsRouter from './jobs.routes.js';
import linksRouter from './links.routes.js';
import notificationsRouter from './notifications.routes.js';
import projectsRouter from './projects.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use(dashboardRouter);
router.use('/drive-accounts', driveAccountsRouter);
router.use('/links', linksRouter);
router.use('/projects', projectsRouter);
router.use(jobsRouter);
router.use(notificationsRouter);

export default router;
