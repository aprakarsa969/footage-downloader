// Controller Jobs: submit batch, list, detail, retry, cancel.
// Validasi input batch dilakukan di sini (mode, resolution, trim untuk timestamp).
import type { Request, Response } from 'express';
import { jobsService } from '../services/jobs.service.js';
import { AppError } from '../utils/AppError.js';

const MAX_BATCH_LINKS = 50;

/**
 * Submit batch download. Validasi per link:
 * - url wajib; mode 'full'|'timestamp'; resolution (opsional) harus string.
 * - mode timestamp wajib trim_start_seconds/trim_end_seconds integer, end > start >= 0.
 * Maksimal 50 link per batch.
 */
export async function createBatch(req: Request, res: Response) {
  const links = req.body?.links;
  if (!Array.isArray(links) || links.length === 0) {
    throw new AppError(400, 'INVALID_REQUEST', 'links harus berupa array non-kosong');
  }
  if (links.length > MAX_BATCH_LINKS) {
    throw new AppError(400, 'INVALID_REQUEST', `links maksimal ${MAX_BATCH_LINKS} per batch`);
  }
  for (const item of links) {
    if (typeof item?.url !== 'string' || !item.url) {
      throw new AppError(400, 'INVALID_REQUEST', 'setiap link wajib punya url');
    }
    const mode = item.mode ?? 'full';
    if (mode !== 'full' && mode !== 'timestamp') {
      throw new AppError(400, 'INVALID_REQUEST', 'mode harus "full" atau "timestamp"');
    }
    if (item.resolution !== undefined && typeof item.resolution !== 'string') {
      throw new AppError(400, 'INVALID_REQUEST', 'resolution harus string');
    }
    if (mode === 'timestamp') {
      const { trim_start_seconds: start, trim_end_seconds: end } = item;
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        (start as number) < 0 ||
        (end as number) <= (start as number)
      ) {
        throw new AppError(
          400,
          'INVALID_REQUEST',
          'mode timestamp wajib punya trim_start_seconds dan trim_end_seconds (integer, end > start >= 0)',
        );
      }
    }
  }

  const projectId = String(req.params.projectId);
  const result = await jobsService.createBatch(req.user!.id, projectId, links);
  res.json(result);
}

/** List job satu project (filter status + pagination). */
export async function listJobs(req: Request, res: Response) {
  const projectId = String(req.params.projectId);
  const result = await jobsService.listJobs(req.user!.id, projectId, {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    page: req.query.page !== undefined ? Number(req.query.page) : undefined,
    limit: req.query.limit !== undefined ? Number(req.query.limit) : undefined,
  });
  res.json(result);
}

/** Detail satu job. */
export async function getJob(req: Request, res: Response) {
  const job = await jobsService.getJob(req.user!.id, String(req.params.id));
  res.json(job);
}

/** Retry job failed → pending. */
export async function retryJob(req: Request, res: Response) {
  const job = await jobsService.retryJob(req.user!.id, String(req.params.id));
  res.json(job);
}

/** Cancel job pending/processing. */
export async function cancelJob(req: Request, res: Response) {
  const job = await jobsService.cancelJob(req.user!.id, String(req.params.id));
  res.json(job);
}
