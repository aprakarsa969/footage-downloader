export type JobStatus = "pending" | "processing" | "done" | "failed" | "cancelled";

export type Job = {
  id: string;
  projectId?: string;
  projectName?: string;
  videoTitle?: string | null;
  url: string;
  platform: string;
  thumbnailUrl?: string | null;
  status: JobStatus;
  progressPercent: number;
  stage?: string | null;
  driveFileUrl?: string | null;
  errorMessage?: string | null;
};
