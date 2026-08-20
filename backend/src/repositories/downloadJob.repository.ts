// Repositori DownloadJob: akses data ke tabel `download_jobs` — inti pipeline download.
// Mencakup: buat batch, update progress, query per project/user, agregasi status untuk dashboard.
import prisma from '../config/prisma.js';
import type { JobMode, JobStatus } from '@prisma/client';

type CreateDownloadJobInput = {
  projectId: string;
  sourceUrl: string;
  platform: string;
  videoTitle: string | null;
  videoDurationSeconds: number | null;
  thumbnailUrl: string | null;
  mode: JobMode;
  resolution: string | null;
};

/** Buat satu job download (dipakai alur single-job lama). */
export function createDownloadJob(data: CreateDownloadJobInput) {
  return prisma.downloadJob.create({ data });
}

type CreateBatchJobInput = {
  projectId: string;
  sourceUrl: string;
  platform: string;
  mode: JobMode;
  resolution: string | null;
  trimStartSeconds: number | null;
  trimEndSeconds: number | null;
  batchId: string;
};

/**
 * Buat banyak job sekaligus dalam satu batch (satu batchId).
 * Catatan: createManyAndReturn butuh kolom platform non-null → diisi 'unknown' di service,
 * lalu diisi nilai asli oleh worker setelah metadata berhasil diambil.
 */
export function createBatchJobs(data: CreateBatchJobInput[]) {
  return prisma.downloadJob.createManyAndReturn({ data });
}

type JobUpdateInput = Partial<{
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
  retryCount: number;
  batchId: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}>;

/** Update kolom job tertentu (dipakai worker untuk tiap tahap, service untuk retry/cancel). */
export function updateDownloadJob(id: string, data: JobUpdateInput) {
  return prisma.downloadJob.update({ where: { id }, data });
}

/** Cari job by id + info project pemiliknya (cek kepemilikan + ambil folder Drive tujuan). */
export function findDownloadJobById(id: string) {
  return prisma.downloadJob.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          userId: true,
          driveAccountId: true,
          driveFolderId: true,
          driveFolderUrl: true,
        },
      },
    },
  });
}

/** Jumlah job dalam satu batch dengan status tertentu (dipakai worker cek batch selesai). */
export function countDownloadJobsByBatchAndStatus(batchId: string, statuses: JobStatus[]) {
  return prisma.downloadJob.count({ where: { batchId, status: { in: statuses } } });
}

/** Jumlah job per project (opsional filter status) — untuk pagination list job. */
export function countDownloadJobsByProject(projectId: string, status?: JobStatus) {
  return prisma.downloadJob.count({
    where: { projectId, ...(status ? { status } : {}) },
  });
}

/** List job satu project, terbaru dulu, paginated. */
export function listDownloadJobsByProject(
  projectId: string,
  page: number,
  limit: number,
  status?: JobStatus,
) {
  return prisma.downloadJob.findMany({
    where: { projectId, ...(status ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
}

/** Jumlah job per status dalam satu project (untuk ringkasan di GET /projects/:id). */
export function countProjectJobsByStatus(projectId: string) {
  return prisma.downloadJob.groupBy({
    by: ['status'],
    where: { projectId },
    _count: { status: true },
  });
}

// ---- Query lintas project untuk dashboard ----

type JobFilters = {
  projectId?: string;
  status?: JobStatus;
  platform?: string;
  from?: Date;
  to?: Date;
  search?: string;
};

/** Konstruksi where: semua job user (project non-deleted) + filter opsional. */
function jobWhereByUser(userId: string, filters: JobFilters = {}) {
  return {
    project: { userId, deletedAt: null },
    ...(filters.projectId ? { projectId: filters.projectId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.platform ? { platform: filters.platform } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { videoTitle: { contains: filters.search, mode: 'insensitive' as const } },
            { sourceUrl: { contains: filters.search, mode: 'insensitive' as const } },
            { project: { name: { contains: filters.search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };
}

/** Jumlah job user (opsional filter status). */
export function countDownloadJobsByUser(userId: string, status?: JobStatus) {
  return prisma.downloadJob.count({ where: jobWhereByUser(userId, { status }) });
}

/** Pemetaan driveFileId → thumbnailUrl untuk fallback thumbnail Google Drive. */
export function findThumbnailsByDriveFileIds(driveFileIds: string[]) {
  if (driveFileIds.length === 0) return Promise.resolve([]);
  return prisma.downloadJob.findMany({
    where: { driveFileId: { in: driveFileIds } },
    select: { driveFileId: true, thumbnailUrl: true },
  });
}

/** Jumlah job per status untuk semua project user — untuk summary dashboard. */
export function groupDownloadJobsByUserStatus(userId: string) {
  return prisma.downloadJob.groupBy({
    by: ['status'],
    where: { project: { userId, deletedAt: null } },
    _count: { status: true },
  });
}

/** Jumlah job aktif (pending/processing) user. */
export function countActiveJobsByUser(userId: string) {
  return prisma.downloadJob.count({
    where: { project: { userId, deletedAt: null }, status: { in: ['pending', 'processing'] } },
  });
}

/** Kolom job yang dipakai response dashboard (termasuk nama project). */
const JOB_ITEM_SELECT = {
  id: true,
  projectId: true,
  sourceUrl: true,
  videoTitle: true,
  platform: true,
  thumbnailUrl: true,
  mode: true,
  status: true,
  progressPercent: true,
  errorMessage: true,
  driveFileUrl: true,
  createdAt: true,
  finishedAt: true,
  project: { select: { id: true, name: true } },
} as const;

/** List job aktif user (pending/processing), terbaru dulu, paginated. */
export function listActiveJobsByUser(userId: string, page: number, limit: number) {
  return prisma.downloadJob.findMany({
    where: { project: { userId, deletedAt: null }, status: { in: ['pending', 'processing'] } },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    select: JOB_ITEM_SELECT,
  });
}

/** List riwayat job user + filter (project/status/platform/kisaran createdAt), paginated. */
export function listHistoryJobsByUser(
  userId: string,
  filters: JobFilters,
  page: number,
  limit: number,
) {
  return prisma.downloadJob.findMany({
    where: jobWhereByUser(userId, filters),
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    select: JOB_ITEM_SELECT,
  });
}

/** Jumlah riwayat job user + filter (untuk pagination). */
export function countHistoryJobsByUser(userId: string, filters: JobFilters) {
  return prisma.downloadJob.count({ where: jobWhereByUser(userId, filters) });
}

/** Hapus 1 riwayat job milik user (via project ownership). */
export function deleteHistoryJobByUser(id: string, userId: string) {
  return prisma.downloadJob.deleteMany({
    where: { id, project: { userId, deletedAt: null } },
  });
}

/** Hapus semua riwayat selesai/gagal/dibatalkan milik user (pending/processing dilindungi). */
export function clearHistoryJobsByUser(userId: string) {
  return prisma.downloadJob.deleteMany({
    where: {
      project: { userId, deletedAt: null },
      status: { in: ['done', 'failed', 'cancelled'] },
    },
  });
}
