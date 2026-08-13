// Service Dashboard: agregasi data lintas project user untuk halaman dashboard.
// summary → angka global; activeJobs → job yang sedang berjalan; history → riwayat job + filter.
import {
  countActiveJobsByUser,
  countHistoryJobsByUser,
  groupDownloadJobsByUserStatus,
  listActiveJobsByUser,
  listHistoryJobsByUser,
} from '../repositories/downloadJob.repository.js';
import { sumDriveStorageByUser } from '../repositories/driveAccount.repository.js';
import {
  countProjectsByUser,
  findProjectByIdAndUser,
  sumProjectFootageByUser,
} from '../repositories/project.repository.js';
import { AppError } from '../utils/AppError.js';
import { jobToSummaryResponse } from '../utils/responses.js';

/**
 * Ringkasan dashboard:
 * - total_projects / total_footage (sum total_footage_count)
 * - jobs: jumlah job per status (semua project)
 * - storage: total kuota drive akun aktif (BigInt → string)
 */
async function summary(userId: string) {
  const [projects, footage, byStatus, storage] = await Promise.all([
    countProjectsByUser(userId),
    sumProjectFootageByUser(userId),
    groupDownloadJobsByUserStatus(userId),
    sumDriveStorageByUser(userId),
  ]);

  const counts = { pending: 0, processing: 0, done: 0, failed: 0, cancelled: 0 } as Record<
    string,
    number
  >;
  for (const row of byStatus) {
    counts[row.status] = row._count.status;
  }

  return {
    total_projects: projects,
    total_footage: footage._sum.totalFootageCount ?? 0,
    jobs: counts,
    storage: {
      used_bytes: (storage._sum.storageUsedBytes ?? 0n).toString(),
      total_bytes: (storage._sum.storageTotalBytes ?? 0n).toString(),
    },
  };
}

/** List job aktif (pending/processing) user, paginated. */
async function activeJobs(userId: string, page: number, limit: number) {
  const [data, total] = await Promise.all([
    listActiveJobsByUser(userId, page, limit),
    countActiveJobsByUser(userId),
  ]);
  return { data: data.map(jobToSummaryResponse), total, page, limit };
}

/**
 * Riwayat job user + filter (semua opsional): project_id, status, platform, from/to (createdAt ISO).
 * Validasi: status harus enum valid, from/to format tanggal valid, from <= to, project_id milik user.
 */
async function history(
  userId: string,
  query: {
    projectId?: string;
    status?: string;
    platform?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  },
) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 20));

  const validStatuses = ['pending', 'processing', 'done', 'failed', 'cancelled'];
  if (query.status && !validStatuses.includes(query.status)) {
    throw new AppError(400, 'INVALID_REQUEST', 'status tidak valid');
  }
  const from = parseDate(query.from);
  const to = parseDate(query.to);
  if (from && to && from > to) {
    throw new AppError(400, 'INVALID_REQUEST', 'from tidak boleh melebihi to');
  }
  if (query.projectId) {
    const project = await findProjectByIdAndUser(query.projectId, userId);
    if (!project) {
      throw new AppError(404, 'NOT_FOUND', 'Project not found');
    }
  }

  const filters = {
    projectId: query.projectId,
    status: query.status as 'pending' | 'processing' | 'done' | 'failed' | 'cancelled' | undefined,
    platform: query.platform,
    from,
    to,
  };
  const [data, total] = await Promise.all([
    listHistoryJobsByUser(userId, filters, page, limit),
    countHistoryJobsByUser(userId, filters),
  ]);
  return { data: data.map(jobToSummaryResponse), total, page, limit };
}

/** Parse string tanggal ISO; invalid → AppError 400. */
function parseDate(value?: string) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, 'INVALID_REQUEST', 'format tanggal tidak valid (gunakan ISO)');
  }
  return date;
}

export const dashboardService = { summary, activeJobs, history };
