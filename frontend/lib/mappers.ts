import type { DashboardSummary } from "@/components/organisms/SummaryCardGroup";
import type {
  ApiDashboardSummary,
  ApiDriveAccount,
  ApiJob,
  ApiJobSummary,
  ApiNotification,
  ApiProject,
} from "@/types/api";
import type { DriveAccount } from "@/types/drive-account";
import type { HistoryEntry } from "@/types/history";
import type { Job } from "@/types/job";
import type { AppNotification } from "@/types/notification";
import type { Project } from "@/types/project";

export function mapApiNotificationToAppNotification(
  notification: ApiNotification,
): AppNotification {
  return {
    id: notification.id,
    message: notification.message,
    createdAt: notification.created_at,
    isRead: notification.is_read,
    projectId: notification.project_id ?? undefined,
  };
}

export function mapApiDriveAccountToDriveAccount(
  account: ApiDriveAccount,
): DriveAccount {
  return {
    id: account.id,
    email: account.google_account_email,
    isDefault: account.is_default,
    isActive: account.is_active,
    storageUsedBytes: Number(account.storage_used_bytes ?? 0),
    storageTotalBytes: Number(account.storage_total_bytes ?? 0),
    connectedAt: account.connected_at,
  };
}

export function mapJobToJob(job: ApiJob): Job {
  return {
    id: job.id,
    projectId: undefined,
    videoTitle: job.video_title,
    url: job.source_url,
    platform: job.platform,
    thumbnailUrl: job.thumbnail_url,
    status: job.status,
    progressPercent: job.progress_percent,
    stage: null,
    driveFileUrl: job.drive_file_url,
    errorMessage: job.error_message,
  };
}

export function mapJobSummaryToJob(job: ApiJobSummary): Job {
  return {
    id: job.id,
    projectId: job.project_id,
    projectName: job.project_name,
    videoTitle: job.video_title,
    url: job.source_url,
    platform: job.platform,
    thumbnailUrl: null,
    status: job.status,
    progressPercent: job.progress_percent,
    stage: null,
    driveFileUrl: job.drive_file_url,
    errorMessage: job.error_message,
  };
}

export function mapJobSummaryToHistoryEntry(job: ApiJobSummary): HistoryEntry {
  return {
    id: job.id,
    thumbnailUrl: null,
    videoTitle: job.video_title,
    url: job.source_url,
    platform: job.platform,
    projectName: job.project_name,
    projectId: job.project_id,
    mode: job.mode,
    resolution: null,
    status: job.status,
    createdAt: job.created_at,
    driveFileUrl: job.drive_file_url,
    errorMessage: job.error_message,
  };
}

export function mapProjectToProject(project: ApiProject): Project {
  return {
    id: project.id,
    name: project.name,
    footageCount: project.total_footage_count,
    driveFolderUrl: project.drive_folder_url,
    createdAt: project.created_at,
  };
}

export function mapSummaryToDashboardSummary(
  summary: ApiDashboardSummary,
): DashboardSummary {
  return {
    totalProjects: summary.total_projects,
    totalFootage: summary.total_footage,
    activeJobsCount: summary.jobs.pending + summary.jobs.processing,
    storageUsedBytes: Number(summary.storage.used_bytes),
    storageTotalBytes: Number(summary.storage.total_bytes),
  };
}
