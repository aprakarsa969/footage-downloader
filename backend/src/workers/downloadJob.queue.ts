// Queue BullMQ 'download-jobs'. Producer: service jobs menambahkan job; consumer: worker.
// JobId BullMQ sengaja TIDAK di-set (auto-unique) — kalau pakai custom id yang sama dengan job
// yang sudah selesai (completed/failed), BullMQ men-dedupe dan retry tidak akan pernah di-proses lagi.
import { Queue } from 'bullmq';
import { getRedisConnection } from '../config/redis.js';

export const DOWNLOAD_QUEUE_NAME = 'download-jobs';

let _queue: Queue | null = null;

function getQueue(): Queue {
  if (!_queue) {
    _queue = new Queue(DOWNLOAD_QUEUE_NAME, { connection: getRedisConnection() });
  }
  return _queue;
}

/** Tambah satu job ke antrian. data.jobId = id row download_jobs di DB. */
export async function enqueueJob(jobId: string, projectId: string, userId: string) {
  await getQueue().add('process', { jobId, projectId, userId });
}
