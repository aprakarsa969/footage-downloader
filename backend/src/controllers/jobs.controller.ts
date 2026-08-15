// Controller Jobs: submit batch, list, detail, retry, cancel.
// Validasi input batch dilakukan di batchIntake module (deep module).
import type { Request, Response } from 'express';
import { batchIntake } from '../services/batchIntake.js';
import { jobsService } from '../services/jobs.service.js';

/** Submit batch download — delegasi ke deep batchIntake module. */
export async function createBatch(req: Request, res: Response) {
  const result = await batchIntake(req.user!.id, String(req.params.projectId), req.body?.links);
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
