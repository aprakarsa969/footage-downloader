import type { JobStatus } from "@/types/job";

export type HistoryEntry = {
  id: string;
  thumbnailUrl?: string | null;
  videoTitle?: string | null;
  url: string;
  platform: string;
  projectName?: string;
  projectId?: string;
  mode: "full" | "timestamp";
  resolution?: string | null;
  status: JobStatus;
  createdAt: string;
  driveFileUrl?: string | null;
  errorMessage?: string | null;
};
