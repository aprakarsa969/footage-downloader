import type { QueryClient } from "@tanstack/react-query";

import type { ApiJobSummary, Paginated } from "@/types/api";

export type JobListData = Paginated<ApiJobSummary> | ApiJobSummary[];

function patchJobInData(
  data: JobListData | undefined,
  jobId: string,
  patch: (job: ApiJobSummary) => ApiJobSummary,
): JobListData | undefined {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map((job) => (job.id === jobId ? patch(job) : job));
  }
  return {
    ...data,
    data: data.data.map((job) => (job.id === jobId ? patch(job) : job)),
  };
}

function removeJobFromData(
  data: JobListData | undefined,
  jobId: string,
): JobListData | undefined {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.filter((job) => job.id !== jobId);
  }
  return {
    ...data,
    data: data.data.filter((job) => job.id !== jobId),
    total: Math.max(0, data.total - 1),
  };
}

export function patchJobProgress(
  queryClient: QueryClient,
  jobId: string,
  progressPercent: number,
  stage?: string | null,
): void {
  const patcher = (job: ApiJobSummary) => ({
    ...job,
    progress_percent: progressPercent,
    ...(stage ? { stage } : {}),
  });
  queryClient.setQueriesData<JobListData>(
    { queryKey: ["dashboard", "active-jobs"] },
    (data) => patchJobInData(data, jobId, patcher),
  );
  queryClient.setQueriesData<JobListData>(
    { queryKey: ["project-jobs"] },
    (data) => patchJobInData(data, jobId, patcher),
  );
}

export function markJobDone(
  queryClient: QueryClient,
  jobId: string,
  driveFileUrl: string,
  projectId?: string,
): void {
  queryClient.setQueriesData<JobListData>(
    { queryKey: ["dashboard", "active-jobs"] },
    (data) => removeJobFromData(data, jobId),
  );
  queryClient.setQueriesData<JobListData>(
    { queryKey: ["project-jobs"] },
    (data) =>
      patchJobInData(data, jobId, (job) => ({
        ...job,
        status: "done",
        progress_percent: 100,
        drive_file_url: driveFileUrl,
      })),
  );
  queryClient.invalidateQueries({ queryKey: ["projects"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["history"] });
  queryClient.invalidateQueries({ queryKey: ["project-drive-files", projectId] });
}

export function markJobFailed(
  queryClient: QueryClient,
  jobId: string,
  errorMessage: string,
): void {
  queryClient.setQueriesData<JobListData>(
    { queryKey: ["dashboard", "active-jobs"] },
    (data) => removeJobFromData(data, jobId),
  );
  queryClient.setQueriesData<JobListData>(
    { queryKey: ["project-jobs"] },
    (data) =>
      patchJobInData(data, jobId, (job) => ({
        ...job,
        status: "failed",
        error_message: errorMessage,
      })),
  );
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["history"] });
}

export function handleBatchCompletion(
  queryClient: QueryClient,
  projectId: string,
): void {
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  queryClient.invalidateQueries({ queryKey: ["projects"] });
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
  queryClient.invalidateQueries({ queryKey: ["history"] });
  queryClient.invalidateQueries({ queryKey: ["project-drive-files", projectId] });
}
