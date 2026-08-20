// Controller Dashboard: summary, active-jobs, history, delete.
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

/** Riwayat job + filter (validated via Zod middleware). */
export async function history(req: Request, res: Response) {
  const q = req.query as Record<string, string>;
  res.json(
    await dashboardService.history(req.user!.id, {
      projectId: q.project_id,
      status: q.status,
      platform: q.platform,
      from: q.from,
      to: q.to,
      search: q.q,
      page: Number(q.page) || 1,
      limit: Number(q.limit) || 20,
    }),
  );
}

/** Hapus 1 item riwayat. */
export async function deleteHistoryItem(req: Request, res: Response) {
  await dashboardService.deleteHistoryItem(req.user!.id, String(req.params.id));
  res.status(204).send();
}

/** Hapus semua riwayat selesai/gagal/dibatalkan. */
export async function clearHistory(req: Request, res: Response) {
  const result = await dashboardService.clearHistory(req.user!.id);
  res.json(result);
}
