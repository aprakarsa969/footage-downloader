// Unit test pipeline download (tests/unit). Tanpa infra: adapter downloader/trimmer/
// uploader/emitter/store diganti stub in-memory. Kasus cleanup pakai fs asli (backend/tmp).
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import type { JobStatus } from '@prisma/client';
import type { PipelineDriveAccount, PipelineJob, PipelineJobUpdate } from '../../src/types/pipeline.js';
import { createDownloadPipeline } from '../../src/workers/downloadPipeline.js';

const TMP_DIR = path.resolve('tmp');
const JOB_DIR = path.join(TMP_DIR, 'job-1');

function makeJob(overrides: Partial<PipelineJob> = {}): PipelineJob {
  return {
    id: 'job-1',
    projectId: 'proj-1',
    sourceUrl: 'https://example.com/video',
    mode: 'full',
    resolution: null,
    trimStartSeconds: null,
    trimEndSeconds: null,
    status: 'pending',
    batchId: null,
    project: { id: 'proj-1', userId: 'user-1', driveAccountId: 'acc-1', driveFolderId: 'folder-1' },
    ...overrides,
  };
}

const ACCOUNT: PipelineDriveAccount = { id: 'acc-1', accessToken: 'x', refreshToken: 'x', tokenExpiresAt: new Date(0) };

type HarnessOpts = {
  job?: PipelineJob;
  account?: PipelineDriveAccount | null;
  downloadThrows?: boolean;
  downloadThrowsOnKeyframe?: boolean;
  keyframePts?: number | null;
  remainingByBatch?: Record<string, number>;
  doneByBatch?: Record<string, number>;
  failedByBatch?: Record<string, number>;
  setCancelledOnUpload?: boolean;
};

/** Bangun pipeline + stub lengkap; mengembalikan state & rekaman pemanggilan untuk assert. */
function makeHarness(opts: HarnessOpts = {}) {
  const job = opts.job ?? makeJob();
  const state = {
    jobs: { [job.id]: job } as Record<string, PipelineJob>,
    account: opts.account === undefined ? ACCOUNT : opts.account,
    remainingByBatch: opts.remainingByBatch ?? {},
    doneByBatch: opts.doneByBatch ?? {},
    failedByBatch: opts.failedByBatch ?? {},
    updates: [] as { id: string; data: PipelineJobUpdate }[],
    notifications: [] as { userId: string; projectId: string; batchId: string; message: string }[],
    footageIncrements: [] as string[],
  };
  const calls = {
    download: [] as { url: string; outputDir: string; useKeyframeCuts?: boolean }[],
    trim: [] as { input: string; output: string }[],
    upload: [] as { account: PipelineDriveAccount; folderId: string; filePath: string }[],
    progress: [] as { percent: number; stage: string }[],
    done: [] as unknown[],
    failed: [] as unknown[],
    batchCompleted: [] as unknown[],
  };

  const downloader = {
    fetchMetadata: async () => ({ title: 'T', durationSeconds: 100, thumbnailUrl: 't.png', platform: 'youtube' }),
    download: async (url: string, outputDir: string, _options: unknown, useKeyframeCuts?: boolean) => {
      calls.download.push({ url, outputDir, useKeyframeCuts });
      if (opts.downloadThrowsOnKeyframe && useKeyframeCuts) throw new Error('keyframe cut gagal');
      if (opts.downloadThrows) throw new Error('download gagal');
      await mkdir(outputDir, { recursive: true });
      const filePath = path.join(outputDir, 'out.mp4');
      await writeFile(filePath, 'x');
      return { filePath };
    },
  };
  const trimmer = {
    probeFirstKeyframe: async () => opts.keyframePts ?? null,
    trim: async (input: string, output: string) => {
      calls.trim.push({ input, output });
      await mkdir(path.dirname(output), { recursive: true });
      await writeFile(output, 'x');
    },
  };
  const uploader = {
    upload: async (account: PipelineDriveAccount, folderId: string, filePath: string) => {
      calls.upload.push({ account, folderId, filePath });
      if (opts.setCancelledOnUpload) state.jobs[job.id].status = 'cancelled';
      return { id: 'file-1', url: 'https://drive.google.com/file-1' };
    },
  };
  const emitter = {
    progress: (_u: string, _j: string, _p: string, percent: number, stage: string) => {
      calls.progress.push({ percent, stage });
    },
    done: (_u: string, data: unknown) => calls.done.push(data),
    failed: (_u: string, data: unknown) => calls.failed.push(data),
    batchCompleted: (_u: string, data: unknown) => calls.batchCompleted.push(data),
  };
  const store = {
    findById: async (id: string) => state.jobs[id] ?? null,
    update: async (id: string, data: PipelineJobUpdate) => {
      state.updates.push({ id, data });
      state.jobs[id] = { ...state.jobs[id], ...data };
    },
    countByBatchAndStatus: async (batchId: string, statuses: JobStatus[]) => {
      if (statuses.includes('pending') || statuses.includes('processing')) return state.remainingByBatch[batchId] ?? 0;
      if (statuses.includes('done')) return state.doneByBatch[batchId] ?? 0;
      return state.failedByBatch[batchId] ?? 0;
    },
    incrementFootageCount: async (projectId: string) => {
      state.footageIncrements.push(projectId);
    },
    createNotification: async (userId: string, projectId: string, batchId: string, message: string) => {
      state.notifications.push({ userId, projectId, batchId, message });
    },
    findDriveAccountByIdAndUser: async () => state.account,
  };

  const pipeline = createDownloadPipeline({ downloader, trimmer, uploader, emitter, store });
  return { pipeline, state, calls, job };
}

const PROCESS = { jobId: 'job-1', projectId: 'proj-1', userId: 'user-1' };

after(() => rm(JOB_DIR, { recursive: true, force: true }));

describe('pipeline download', () => {
  it('guard cancel awal → no-op (tanpa download/update)', async () => {
    const { pipeline, state, calls } = makeHarness({ job: makeJob({ status: 'cancelled' }) });
    await pipeline.processJob(PROCESS);
    assert.equal(calls.download.length, 0);
    assert.equal(state.updates.length, 0);
  });

  it('full mode sukses → done, upload, emit, increment footage', async () => {
    const { pipeline, state, calls } = makeHarness();
    await pipeline.processJob(PROCESS);
    assert.equal(state.jobs['job-1'].status, 'done');
    assert.equal(state.jobs['job-1'].progressPercent, 100);
    assert.equal(state.jobs['job-1'].driveFileId, 'file-1');
    assert.equal(state.jobs['job-1'].fileName, 'out.mp4');
    assert.equal(state.updates[0].data.status, 'processing');
    assert.equal(calls.upload.length, 1);
    assert.equal(calls.done.length, 1);
    assert.deepEqual(state.footageIncrements, ['proj-1']);
  });

  it('download gagal → status failed + emit failed', async () => {
    const { pipeline, state, calls } = makeHarness({ downloadThrows: true });
    await pipeline.processJob(PROCESS);
    assert.equal(state.jobs['job-1'].status, 'failed');
    assert.equal(state.jobs['job-1'].errorMessage, 'download gagal');
    assert.equal(calls.failed.length, 1);
    assert.equal(calls.done.length, 0);
  });

  it('cancel saat upload → tanpa update status final', async () => {
    const { pipeline, state, calls } = makeHarness({ setCancelledOnUpload: true });
    await pipeline.processJob(PROCESS);
    assert.equal(state.jobs['job-1'].status, 'cancelled');
    assert.equal(calls.done.length, 0);
    assert.equal(calls.failed.length, 0);
    const finalUpdate = state.updates.find((u) => u.data.status === 'done' || u.data.status === 'failed');
    assert.equal(finalUpdate, undefined);
  });

  it('mode timestamp: keyframe gagal → fallback probe + trim', async () => {
    const job = makeJob({ mode: 'timestamp', trimStartSeconds: 2, trimEndSeconds: 10 });
    const { pipeline, state, calls } = makeHarness({ job, downloadThrowsOnKeyframe: true, keyframePts: 5 });
    await pipeline.processJob(PROCESS);
    assert.equal(calls.download.length, 2);
    assert.equal(calls.download[0].useKeyframeCuts, true);
    assert.equal(calls.download[1].useKeyframeCuts, false);
    assert.equal(calls.trim.length, 1);
    assert.ok(calls.trim[0].output.endsWith('_trimmed.mp4'));
    assert.equal(state.jobs['job-1'].status, 'done');
    assert.equal(calls.upload[0].filePath, calls.trim[0].output);
    assert.ok(calls.progress.some((p) => p.percent === 55 && p.stage === 'trimming'));
  });

  it('mode timestamp: keyframe pertama < 1s → tanpa trim', async () => {
    const job = makeJob({ mode: 'timestamp', trimStartSeconds: 2, trimEndSeconds: 10 });
    const { pipeline, calls } = makeHarness({ job, downloadThrowsOnKeyframe: true, keyframePts: 0.2 });
    await pipeline.processJob(PROCESS);
    assert.equal(calls.download.length, 2);
    assert.equal(calls.trim.length, 0);
    assert.equal(calls.upload[0].filePath, path.join(JOB_DIR, 'out.mp4'));
  });

  it('batch selesai (remaining 0) → notifikasi + emit batch:completed', async () => {
    const job = makeJob({ batchId: 'batch-1' });
    const { pipeline, state, calls } = makeHarness({
      job,
      remainingByBatch: { 'batch-1': 0 },
      doneByBatch: { 'batch-1': 2 },
      failedByBatch: { 'batch-1': 1 },
    });
    await pipeline.processJob(PROCESS);
    assert.equal(state.notifications.length, 1);
    assert.equal(state.notifications[0].message, 'Batch download selesai: 2 sukses, 1 gagal');
    assert.equal(calls.batchCompleted.length, 1);
    assert.deepEqual(calls.batchCompleted[0], { batchId: 'batch-1', projectId: 'proj-1', total: 3, done: 2, failed: 1 });
  });

  it('batch belum selesai (remaining > 0) → tanpa notifikasi', async () => {
    const job = makeJob({ batchId: 'batch-1' });
    const { pipeline, state, calls } = makeHarness({ job, remainingByBatch: { 'batch-1': 1 } });
    await pipeline.processJob(PROCESS);
    assert.equal(state.notifications.length, 0);
    assert.equal(calls.batchCompleted.length, 0);
  });

  it('akun Drive hilang → status failed dengan pesan spesifik', async () => {
    const { pipeline, state, calls } = makeHarness({ account: null });
    await pipeline.processJob(PROCESS);
    assert.equal(state.jobs['job-1'].status, 'failed');
    assert.equal(state.jobs['job-1'].errorMessage, 'Drive account untuk project tidak ditemukan');
    assert.equal(calls.failed.length, 1);
  });

  it('cleanup: file + folder sementara terhapus (fs asli)', async () => {
    const { pipeline } = makeHarness();
    await pipeline.processJob(PROCESS);
    assert.equal(existsSync(JOB_DIR), false);
    assert.equal(existsSync(path.join(JOB_DIR, 'out.mp4')), false);
  });
});
