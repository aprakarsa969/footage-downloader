// Service Jobs: alur batch download, list/get job, retry, dan cancel.
// Alur: user submit batch → job diinsert (pending, satu batchId) → di-enqueue ke BullMQ → worker yang proses.
import { randomUUID } from 'node:crypto';
import { enqueueJob } from '../workers/downloadJob.queue.js';
import {
  countDownloadJobsByProject,
  createBatchJobs,
  findDownloadJobById,
  listDownloadJobsByProject,
  updateDownloadJob,
} from '../repositories/downloadJob.repository.js';
import { findProjectByIdAndUser } from '../repositories/project.repository.js';
import { jobToResponse } from '../utils/responses.js';
import { AppError } from '../utils/AppError.js';

type CreateBatchInput = {
  url: string;
  mode?: string;
  resolution?: string;
  trim_start_seconds?: number;
  trim_end_seconds?: number;
}[];

/**
 * Submit batch download. Setiap link diinsert sebagai job `pending` dengan batchId sama,
 * lalu semua job di-enqueue ke queue BullMQ untuk diproses worker asinkron.
 * platform diisi 'unknown' dulu (createManyAndReturn butuh nilai non-null), worker yang mengisi nilai asli.
 * Kalau enqueue gagal → job langsung ditandai failed (bukan menggagalkan seluruh batch).
 */
async function createBatch(userId: string, projectId: string, links: CreateBatchInput) {
  const project = await findProjectByIdAndUser(projectId, userId);
  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  const batchId = randomUUID();
  const jobs = await createBatchJobs(
    links.map((link) => ({
      projectId,
      sourceUrl: link.url,
      platform: 'unknown',
      mode: (link.mode as 'full' | 'timestamp') ?? 'full',
      resolution: link.resolution ?? null,
      trimStartSeconds: link.trim_start_seconds ?? null,
      trimEndSeconds: link.trim_end_seconds ?? null,
      batchId,
    })),
  );

  await Promise.all(
    jobs.map((job) => enqueueJob(job.id, projectId, userId).catch((err) => {
      console.error(`[jobs] enqueue ${job.id} gagal:`, err);
      return updateDownloadJob(job.id, {
        status: 'failed',
        errorMessage: 'Gagal menambahkan ke antrian',
        finishedAt: new Date(),
      });
    })),
  );

  return {
    batch_id: batchId,
    project_id: projectId,
    jobs: jobs.map((job) => ({
      id: job.id,
      url: job.sourceUrl,
      mode: job.mode,
      resolution: job.resolution,
      trim_start_seconds: job.trimStartSeconds,
      trim_end_seconds: job.trimEndSeconds,
      status: job.status,
    })),
  };
}

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

export const jobsService = { createBatch, listJobs, getJob, retryJob, cancelJob };
