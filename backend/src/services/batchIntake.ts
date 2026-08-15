// Deep Batch Intake Module — encapsulates validation, persistence, and queue dispatch.
// Single interface: submitBatch(). All batch intake lifecycle logic lives here.
// ponytail: controller no longer needs to know about Zod, UUID, or BullMQ fallback.
import { randomUUID } from 'node:crypto';
import { ZodError, z } from 'zod';
import { enqueueJob } from '../workers/downloadJob.queue.js';
import { createBatchJobs, updateDownloadJob } from '../repositories/downloadJob.repository.js';
import { findProjectByIdAndUser } from '../repositories/project.repository.js';
import { AppError } from '../utils/AppError.js';

const MAX_BATCH_LINKS = 50;

export const BatchLinkSchema = z.object({
  url: z.string().min(1, 'setiap link wajib punya url'),
  mode: z.enum(['full', 'timestamp']).default('full'),
  resolution: z.string().optional(),
  trim_start_seconds: z.number().int().min(0).optional(),
  trim_end_seconds: z.number().int().min(0).optional(),
}).refine(
  (data) => {
    if (data.mode === 'timestamp') {
      return data.trim_start_seconds !== undefined && data.trim_end_seconds !== undefined;
    }
    return true;
  },
  { message: 'mode timestamp wajib punya trim_start_seconds dan trim_end_seconds' },
).refine(
  (data) => {
    if (data.mode === 'timestamp' && data.trim_start_seconds !== undefined && data.trim_end_seconds !== undefined) {
      return data.trim_end_seconds > data.trim_start_seconds;
    }
    return true;
  },
  { message: 'trim_end_seconds harus lebih besar dari trim_start_seconds' },
);

export const BatchIntakeSchema = z.array(BatchLinkSchema).min(1, 'links harus berupa array non-kosong').max(MAX_BATCH_LINKS, `links maksimal ${MAX_BATCH_LINKS} per batch`);

type BatchIntakeResult = {
  batch_id: string;
  project_id: string;
  jobs: {
    id: string;
    url: string;
    mode: string;
    resolution: string | null;
    trim_start_seconds: number | null;
    trim_end_seconds: number | null;
    status: string;
  }[];
};

type BatchIntakeDeps = {
  findProjectByIdAndUser: (projectId: string, userId: string) => Promise<{ id: string; userId: string } | null>;
  createBatchJobs: (data: {
    projectId: string;
    sourceUrl: string;
    platform: string;
    mode: 'full' | 'timestamp';
    resolution: string | null;
    trimStartSeconds: number | null;
    trimEndSeconds: number | null;
    batchId: string;
  }[]) => Promise<{
    id: string;
    sourceUrl: string;
    mode: string;
    resolution: string | null;
    trimStartSeconds: number | null;
    trimEndSeconds: number | null;
    status: string;
  }[]>;
  enqueueJob: (jobId: string, projectId: string, userId: string) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateDownloadJob: (id: string, data: any) => Promise<any>;
};

/**
 * Deep interface: validate, persist, and enqueue a batch of download links.
 * Dependencies are injectable for testing.
 */
export function createBatchIntake(deps: BatchIntakeDeps) {
  return async function submitBatch(
    userId: string,
    projectId: string,
    rawLinks: unknown,
  ): Promise<BatchIntakeResult> {
    // 1. Validate payload
    let parsed;
    try {
      parsed = BatchIntakeSchema.parse(rawLinks);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new AppError(400, 'INVALID_REQUEST', err.issues[0]?.message ?? 'Invalid payload');
      }
      throw err;
    }

    // 2. Verify project ownership
    const project = await deps.findProjectByIdAndUser(projectId, userId);
    if (!project) {
      throw new AppError(404, 'NOT_FOUND', 'Project not found');
    }

    // 3. Generate batch ID + persist jobs
    const batchId = randomUUID();
    const jobs = await deps.createBatchJobs(
      parsed.map((link) => ({
        projectId,
        sourceUrl: link.url,
        platform: 'unknown',
        mode: link.mode as 'full' | 'timestamp',
        resolution: link.resolution ?? null,
        trimStartSeconds: link.trim_start_seconds ?? null,
        trimEndSeconds: link.trim_end_seconds ?? null,
        batchId,
      })),
    );

    // 4. Enqueue to BullMQ, catch individual failures
    await Promise.all(
      jobs.map((job) =>
        deps.enqueueJob(job.id, projectId, userId).catch((err) => {
          console.error(`[jobs] enqueue ${job.id} gagal:`, err);
          return deps.updateDownloadJob(job.id, {
            status: 'failed',
            errorMessage: 'Gagal menambahkan ke antrian',
            finishedAt: new Date(),
          });
        }),
      ),
    );

    // 5. Return structured result
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
  };
}

/** Pre-built batch intake using real production deps. */
export const batchIntake = createBatchIntake({
  findProjectByIdAndUser,
  createBatchJobs,
  enqueueJob,
  updateDownloadJob,
});
