// Tipe bersama untuk pipeline download (lihat workers/downloadPipeline.ts).
// Adapter di sini adalah seam: implementasi produksi (yt-dlp/ffmpeg/Drive/Socket.IO/Prisma)
// di-inject saat build di server.ts; test memakai stub. Interface tipis, implementasi dalam.
import type { JobMode, JobStatus } from '@prisma/client';

/** Metadata video hasil fetch (dari adapter downloader). */
export type VideoMetadata = {
  title: string;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  platform: string;
};

/** Record job yang dibaca pipeline dari store (subset kolom yang dipakai pipeline). */
export type PipelineJob = {
  id: string;
  projectId: string;
  sourceUrl: string;
  mode: JobMode;
  resolution: string | null;
  trimStartSeconds: number | null;
  trimEndSeconds: number | null;
  status: JobStatus;
  batchId: string | null;
  project: {
    id: string;
    userId: string;
    driveAccountId: string;
    driveFolderId: string;
  };
};

/** Record akun Drive (token terenkripsi) — cukup untuk refresh/upload. */
export type PipelineDriveAccount = {
  id: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
};

/** Update parsial job — kolom yang boleh diubah pipeline. */
export type PipelineJobUpdate = Partial<{
  status: JobStatus;
  platform: string;
  videoTitle: string | null;
  videoDurationSeconds: number | null;
  thumbnailUrl: string | null;
  progressPercent: number;
  fileName: string | null;
  driveFileId: string | null;
  driveFileUrl: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}>;

/** Adapter: video downloader (yt-dlp di produksi, stub di test). */
export type VideoDownloader = {
  fetchMetadata(url: string): Promise<VideoMetadata>;
  download(
    url: string,
    outputDir: string,
    options: { resolution?: string; startSeconds?: number; endSeconds?: number },
    useKeyframeCuts?: boolean,
  ): Promise<{ filePath: string }>;
};

/** Adapter: video trimmer (ffmpeg di produksi, stub di test). */
export type VideoTrimmer = {
  probeFirstKeyframe(filePath: string): Promise<number | null>;
  trim(inputPath: string, outputPath: string, startSeconds: number, endSeconds: number): Promise<void>;
};

/** Adapter: cloud uploader (Google Drive di produksi, stub di test). */
export type FileUploader = {
  upload(account: PipelineDriveAccount, folderId: string, filePath: string): Promise<{ id: string; url: string }>;
};

/** Adapter: progress/event emitter (Socket.IO di produksi, no-op/recorder di test). */
export type PipelineEmitter = {
  progress(userId: string, jobId: string, projectId: string, percent: number, stage: string): void;
  done(userId: string, data: { jobId: string; projectId: string; driveFileUrl: string; fileName: string }): void;
  failed(userId: string, data: { jobId: string; projectId: string; errorMessage: string }): void;
  batchCompleted(userId: string, data: { batchId: string; projectId: string; total: number; done: number; failed: number }): void;
};

/** Adapter: persistence job (Prisma di produksi, in-memory di test). */
export type JobStore = {
  findById(id: string): Promise<PipelineJob | null>;
  update(id: string, data: PipelineJobUpdate): Promise<unknown>;
  countByBatchAndStatus(batchId: string, statuses: JobStatus[]): Promise<number>;
  incrementFootageCount(projectId: string): Promise<unknown>;
  createNotification(
    userId: string,
    projectId: string | null,
    batchId: string | null,
    message: string,
  ): Promise<unknown>;
  findDriveAccountByIdAndUser(id: string, userId: string): Promise<PipelineDriveAccount | null>;
};
