// Service Jobs: list/get job, retry, dan cancel.
// Batch intake dipindah ke batchIntake.ts (deep module).
import {
  countDownloadJobsByProject,
  findDownloadJobById,
  listDownloadJobsByProject,
  updateDownloadJob,
} from '../repositories/downloadJob.repository.js';
import { findProjectByIdAndUser } from '../repositories/project.repository.js';
import { enqueueJob } from '../workers/downloadJob.queue.js';
import { jobToResponse } from '../utils/responses.js';
import { AppError } from '../utils/AppError.js';

/** List job satu project, paginated, opsional filter status. */
async function listJobs(
  userId: string,
  projectId: string,
  query: { status?: string; page?: number; limit?: number },
) {
  const project = await findProjectByIdAndUser(projectId, userId);
  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 20));
  const status = query.status as 'pending' | 'processing' | 'done' | 'failed' | undefined;

  const [total, jobs] = await Promise.all([
    countDownloadJobsByProject(projectId, status),
    listDownloadJobsByProject(projectId, page, limit, status),
  ]);

  return {
    data: jobs.map(jobToResponse),
    total,
    page,
    limit,
  };
}

/** Detail satu job (dipakai polling manual tanpa WebSocket). 404 kalau bukan milik user. */
async function getJob(userId: string, jobId: string) {
  const job = await findDownloadJobById(jobId);
  if (!job || job.project.userId !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Job not found');
  }
  return jobToResponse(job);
}

/**
 * Retry job `failed`: reset ke `pending` + hapus hasil lama (error/progress/file/timestamp),
 * retryCount +1, dan batchId dikosongkan supaya job yang selesai nanti TIDAK memicu
 * `batch:completed` duplikat untuk batch lama. Lalu re-enqueue.
 */
async function retryJob(userId: string, jobId: string) {
  const job = await findDownloadJobById(jobId);
  if (!job || job.project.userId !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Job not found');
  }
  if (job.status !== 'failed') {
    throw new AppError(409, 'CONFLICT', 'Hanya job berstatus failed yang bisa di-retry');
  }
  const updated = await updateDownloadJob(job.id, {
    status: 'pending',
    errorMessage: null,
    progressPercent: 0,
    fileName: null,
    driveFileId: null,
    driveFileUrl: null,
    startedAt: null,
    finishedAt: null,
    retryCount: job.retryCount + 1,
    batchId: null,
  });
  await enqueueJob(updated.id, updated.projectId, userId);
  return jobToResponse(updated);
}

/**
 * Cancel job `pending`/`processing` → `cancelled`.
 * Tidak perlu menghapus job dari queue BullMQ: worker punya guard — saat job diambil,
 * kalau status sudah cancelled, langsung dilewati tanpa diproses.
 */
async function cancelJob(userId: string, jobId: string) {
  const job = await findDownloadJobById(jobId);
  if (!job || job.project.userId !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Job not found');
  }
  if (job.status !== 'pending' && job.status !== 'processing') {
    throw new AppError(409, 'CONFLICT', 'Hanya job berstatus pending/processing yang bisa di-cancel');
  }
  return jobToResponse(
    await updateDownloadJob(job.id, {
      status: 'cancelled',
      errorMessage: null,
      progressPercent: 0,
      fileName: null,
      driveFileId: null,
      driveFileUrl: null,
      startedAt: null,
      finishedAt: null,
    }),
  );
}

export const jobsService = { listJobs, getJob, retryJob, cancelJob };
