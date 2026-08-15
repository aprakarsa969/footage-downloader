// Entry point server: start worker BullMQ + HTTP server + Socket.IO (semua satu proses).
// Pipeline download di-build di sini dengan adapter produksi, lalu di-inject ke worker.
import 'dotenv/config';
import app from './app.js';
import { redisConnection } from './config/redis.js';
import { initSocket, emitToUser } from './websocket/socket.js';
import { startDownloadWorker } from './workers/downloadJob.worker.js';
import { createDownloadPipeline } from './workers/downloadPipeline.js';
import { createBatchSentinel } from './workers/batchSentinel.js';
import { downloadVideo, fetchVideoMetadata } from './lib/ytdlp.js';
import { probeFirstKeyframe, trimVideo } from './lib/ffmpeg.js';
import { driveStorageAdapter } from './services/driveStorageAdapter.js';
import {
  countDownloadJobsByBatchAndStatus,
  findDownloadJobById,
  updateDownloadJob,
} from './repositories/downloadJob.repository.js';
import { findDriveAccountByIdAndUser } from './repositories/driveAccount.repository.js';
import { incrementProjectFootageCount } from './repositories/project.repository.js';
import { createNotification } from './repositories/notification.repository.js';

const PORT = Number(process.env.PORT) || 4000;

// Batch completion sentinel: atomic lock via Redis SET NX guarantees exactly-once notification.
const batchSentinel = createBatchSentinel({
  countByBatchAndStatus: countDownloadJobsByBatchAndStatus,
  acquireLock: (batchId) =>
    redisConnection.set(`batch:sentinel:${batchId}`, '1', 'EX', 60, 'NX').then((v) => v === 'OK'),
  createNotification: async (userId, projectId, batchId, message) => {
    await createNotification(userId, projectId, batchId, message);
  },
  batchCompleted: (userId, d) =>
    emitToUser(userId, 'batch:completed', {
      batch_id: d.batchId,
      project_id: d.projectId,
      total: d.total,
      done: d.done,
      failed: d.failed,
    }),
});

// Build pipeline: satu-satunya tempat adapter produksi disambungkan ke logic inti.
const pipeline = createDownloadPipeline({
  downloader: {
    fetchMetadata: fetchVideoMetadata,
    download: downloadVideo,
  },
  trimmer: {
    probeFirstKeyframe,
    trim: trimVideo,
  },
  uploader: {
    upload: (account, folderId, filePath) => driveStorageAdapter.uploadFile(account, folderId, filePath),
  },
  emitter: {
    progress: (userId, jobId, projectId, percent, stage) =>
      emitToUser(userId, 'job:progress', {
        job_id: jobId,
        project_id: projectId,
        status: 'processing',
        progress_percent: percent,
        stage,
      }),
    done: (userId, d) =>
      emitToUser(userId, 'job:done', {
        job_id: d.jobId,
        project_id: d.projectId,
        status: 'done',
        drive_file_url: d.driveFileUrl,
        file_name: d.fileName,
      }),
    failed: (userId, d) =>
      emitToUser(userId, 'job:failed', {
        job_id: d.jobId,
        project_id: d.projectId,
        status: 'failed',
        error_message: d.errorMessage,
      }),
    batchCompleted: (userId, d) =>
      emitToUser(userId, 'batch:completed', {
        batch_id: d.batchId,
        project_id: d.projectId,
        total: d.total,
        done: d.done,
        failed: d.failed,
      }),
  },
  store: {
    findById: findDownloadJobById,
    update: updateDownloadJob,
    countByBatchAndStatus: countDownloadJobsByBatchAndStatus,
    incrementFootageCount: incrementProjectFootageCount,
    createNotification,
    findDriveAccountByIdAndUser,
  },
  sentinel: batchSentinel,
});

// Worker berjalan di proses yang sama dengan HTTP server (dev/self-host).
startDownloadWorker(pipeline);
console.log('[worker] download-jobs worker started');

const httpServer = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Socket.IO menempel di HTTP server yang sama.
initSocket(httpServer);
