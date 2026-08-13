// Mapper response API (camelCase Prisma → snake_case JSON).
// Satu tempat per entity — mengganti nama field cukup di sini, bukan di tiap service.
// Dipakai service/controller: jobs, dashboard, notifications, driveAccounts, projects.

/** Response job lengkap (GET /jobs/:id, list project, retry/cancel). */
export function jobToResponse(job: {
  id: string;
  sourceUrl: string;
  platform: string;
  videoTitle: string | null;
  videoDurationSeconds: number | null;
  thumbnailUrl: string | null;
  mode: string;
  resolution: string | null;
  trimStartSeconds: number | null;
  trimEndSeconds: number | null;
  status: string;
  progressPercent: number;
  fileName: string | null;
  driveFileUrl: string | null;
  errorMessage: string | null;
  batchId: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}) {
  return {
    id: job.id,
    batch_id: job.batchId,
    source_url: job.sourceUrl,
    platform: job.platform,
    video_title: job.videoTitle,
    duration_seconds: job.videoDurationSeconds,
    thumbnail_url: job.thumbnailUrl,
    mode: job.mode,
    resolution: job.resolution,
    trim_start_seconds: job.trimStartSeconds,
    trim_end_seconds: job.trimEndSeconds,
    status: job.status,
    progress_percent: job.progressPercent,
    file_name: job.fileName,
    drive_file_url: job.driveFileUrl,
    error_message: job.errorMessage,
    created_at: job.createdAt,
    started_at: job.startedAt,
    finished_at: job.finishedAt,
  };
}

/** Response item job ringkas untuk dashboard (termasuk nama project). */
export function jobToSummaryResponse(job: {
  id: string;
  projectId: string;
  sourceUrl: string;
  videoTitle: string | null;
  platform: string;
  mode: string;
  status: string;
  progressPercent: number;
  errorMessage: string | null;
  driveFileUrl: string | null;
  createdAt: Date;
  finishedAt: Date | null;
  project: { id: string; name: string };
}) {
  return {
    id: job.id,
    project_id: job.project.id,
    project_name: job.project.name,
    source_url: job.sourceUrl,
    video_title: job.videoTitle,
    platform: job.platform,
    mode: job.mode,
    status: job.status,
    progress_percent: job.progressPercent,
    error_message: job.errorMessage,
    drive_file_url: job.driveFileUrl,
    created_at: job.createdAt,
    finished_at: job.finishedAt,
  };
}

/** Response notifikasi. */
export function notificationToResponse(n: {
  id: string;
  batchId: string | null;
  projectId: string | null;
  message: string;
  isRead: boolean;
  createdAt: Date;
}) {
  return {
    id: n.id,
    batch_id: n.batchId,
    project_id: n.projectId,
    message: n.message,
    is_read: n.isRead,
    created_at: n.createdAt,
  };
}

/** Response akun Drive; storage BigInt → string (hindari presisi hilang di JSON). */
export function driveAccountToResponse(
  account: {
    id: string;
    googleAccountEmail: string;
    storageUsedBytes: bigint | null;
    storageTotalBytes: bigint | null;
    isActive: boolean;
    connectedAt: Date;
  },
  isDefault: boolean,
) {
  return {
    id: account.id,
    google_account_email: account.googleAccountEmail,
    storage_used_bytes: account.storageUsedBytes?.toString() ?? null,
    storage_total_bytes: account.storageTotalBytes?.toString() ?? null,
    is_active: account.isActive,
    is_default: isDefault,
    connected_at: account.connectedAt,
  };
}

/** Response project. */
export function projectToResponse(project: {
  id: string;
  name: string;
  driveAccountId: string;
  driveFolderId: string;
  driveFolderUrl: string;
  totalFootageCount: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: project.id,
    name: project.name,
    drive_account_id: project.driveAccountId,
    drive_folder_id: project.driveFolderId,
    drive_folder_url: project.driveFolderUrl,
    total_footage_count: project.totalFootageCount,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}
