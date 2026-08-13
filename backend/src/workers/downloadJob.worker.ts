// Worker BullMQ untuk download job. Tipis: hanya glue queue → pipeline.
// Seluruh logic pipeline ada di downloadPipeline.ts (deep module); pipeline di-build
// di server.ts dengan adapter produksi (yt-dlp, ffmpeg, Drive, Socket.IO, Prisma).
import { Worker, type Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import type { DownloadPipeline } from './downloadPipeline.js';
import { DOWNLOAD_QUEUE_NAME } from './downloadJob.queue.js';

type DownloadJobData = { jobId: string; projectId: string; userId: string };

/** Mulai worker BullMQ (concurrency 2) — dipanggil dari server.ts saat boot. */
export function startDownloadWorker(pipeline: DownloadPipeline) {
  const worker = new Worker<DownloadJobData>(
    DOWNLOAD_QUEUE_NAME,
    async (job: Job<DownloadJobData>) => {
      await pipeline.processJob(job.data);
    },
    { connection: redisConnection, concurrency: 2 },
  );
  worker.on('failed', (job, err) => {
    console.error(`[worker] job ${job?.id} crash:`, err.message);
  });
  return worker;
}
