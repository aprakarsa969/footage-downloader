// Controller Dashboard: summary, active-jobs, history.
import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service.js';

/** Ringkasan global (projects, footage, jobs per status, storage). */
export async function summary(req: Request, res: Response) {
  res.json(await dashboardService.summary(req.user!.id));
}

/** List job aktif (pending/processing), paginated. */
export async function activeJobs(req: Request, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  res.json(await dashboardService.activeJobs(req.user!.id, page, limit));
}

/** Riwayat job + filter (project_id, status, platform, from, to, page, limit). */
export async function history(req: Request, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  res.json(
    await dashboardService.history(req.user!.id, {
      projectId: req.query.project_id as string | undefined,
      status: req.query.status as string | undefined,
      platform: req.query.platform as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      page: Number.isNaN(page) ? undefined : page,
      limit: Number.isNaN(limit) ? undefined : limit,
    }),
  );
}
