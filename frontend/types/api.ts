import type { JobStatus } from "@/types/job";

export type { JobStatus };

export type ApiErrorResponse = {
  error: { code: string; message: string };
};

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

export type AuthResponse = {
  token: string;
  user: ApiUser;
};

export type JobStatusCounts = {
  pending: number;
  processing: number;
  done: number;
  failed: number;
  cancelled: number;
};

export type ApiJob = {
  id: string;
  batch_id: string | null;
  source_url: string;
  platform: string;
  video_title: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  mode: "full" | "timestamp";
  resolution: string | null;
  trim_start_seconds: number | null;
  trim_end_seconds: number | null;
  status: JobStatus;
  progress_percent: number;
  file_name: string | null;
  drive_file_url: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type ApiJobSummary = {
  id: string;
  project_id: string;
  project_name: string;
  source_url: string;
  video_title: string | null;
  platform: string;
  mode: "full" | "timestamp";
  status: JobStatus;
  progress_percent: number;
  stage?: string | null;
  error_message: string | null;
  drive_file_url: string | null;
  created_at: string;
  finished_at: string | null;
};

export type ApiProject = {
  id: string;
  name: string;
  drive_account_id: string;
  drive_folder_id: string;
  drive_folder_url: string;
  total_footage_count: number;
  created_at: string;
  updated_at: string;
};

export type ApiProjectDetail = ApiProject & {
  job_status_summary: JobStatusCounts;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type ApiDriveAccount = {
  id: string;
  google_account_email: string;
  storage_used_bytes: string | null;
  storage_total_bytes: string | null;
  is_active: boolean;
  is_default: boolean;
  connected_at: string;
};

export type ApiNotification = {
  id: string;
  batch_id: string | null;
  project_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type ApiValidateSuccess = {
  url: string;
  title: string;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  platform: string;
  availableResolutions: number[];
};

export type ApiValidateError = {
  url: string;
  error: { code: string; message: string };
};

export type ApiValidateResult = ApiValidateSuccess | ApiValidateError;

export type ApiDashboardSummary = {
  total_projects: number;
  total_footage: number;
  jobs: JobStatusCounts;
  storage: { used_bytes: string; total_bytes: string };
};

export type BatchCreateLink = {
  url: string;
  mode: "full" | "timestamp";
  resolution?: string;
  trim_start_seconds?: number;
  trim_end_seconds?: number;
};

export type BatchCreateRequest = {
  links: BatchCreateLink[];
};

export type BatchCreateResponse = {
  batch_id: string;
  project_id: string;
  jobs: {
    id: string;
    url: string;
    mode: "full" | "timestamp";
    resolution: string | null;
    trim_start_seconds: number | null;
    trim_end_seconds: number | null;
    status: JobStatus | "pending" | "failed";
  }[];
};

export type SetDefaultResponse = {
  default_drive_account_id: string;
};

export type JobProgressEvent = {
  job_id: string;
  project_id: string;
  status: "processing";
  progress_percent: number;
  stage: "downloading" | "trimming" | "uploading";
};

export type JobDoneEvent = {
  job_id: string;
  project_id: string;
  status: "done";
  drive_file_url: string;
  file_name: string;
};

export type JobFailedEvent = {
  job_id: string;
  project_id: string;
  status: "failed";
  error_message: string;
};

export type BatchCompletedEvent = {
  batch_id: string;
  project_id: string;
  total: number;
  done: number;
  failed: number;
};
