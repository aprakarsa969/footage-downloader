"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { getToken } from "@/lib/api";
import { useToastStore } from "@/stores/toast";
import type { ApiJob, ApiJobSummary, BatchCompletedEvent, JobDoneEvent, JobFailedEvent, JobProgressEvent, Paginated } from "@/types/api";

type JobListData = Paginated<ApiJobSummary> | ApiJobSummary[];

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

function patchJobProgress(
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

function markJobDone(
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

function markJobFailed(
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

function handleBatchCompletion(
  queryClient: QueryClient,
  projectId: string,
  done: number,
  failed: number,
): void {
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  queryClient.invalidateQueries({ queryKey: ["projects"] });
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
  queryClient.invalidateQueries({ queryKey: ["history"] });
  queryClient.invalidateQueries({ queryKey: ["project-drive-files", projectId] });
  useToastStore.getState().push(
    `Batch completed — ${done} done, ${failed} failed`,
    failed > 0 ? "error" : "success",
  );
}

function initSocket(queryClient: QueryClient): () => void {
  if (!getToken()) return () => {};
  const socket = getSocket();

  const handleProgress = (payload: JobProgressEvent) => {
    patchJobProgress(queryClient, payload.job_id, payload.progress_percent, payload.stage);
  };
  const handleDone = (payload: JobDoneEvent) => {
    markJobDone(queryClient, payload.job_id, payload.drive_file_url, payload.project_id);
  };
  const handleFailed = (payload: JobFailedEvent) => {
    markJobFailed(queryClient, payload.job_id, payload.error_message);
  };
  const handleBatchCompleted = (payload: BatchCompletedEvent) => {
    handleBatchCompletion(queryClient, payload.project_id, payload.done, payload.failed);
  };

  socket.on("job:progress", handleProgress);
  socket.on("job:done", handleDone);
  socket.on("job:failed", handleFailed);
  socket.on("batch:completed", handleBatchCompleted);

  return () => {
    socket.off("job:progress", handleProgress);
    socket.off("job:done", handleDone);
    socket.off("job:failed", handleFailed);
    socket.off("batch:completed", handleBatchCompleted);
  };
}

export type UseDownloadQueueReturn = {
  activeJobs: ApiJobSummary[];
  recentJobs: ApiJobSummary[];
  activeCount: number;
  isLoading: boolean;
  retry: (jobId: string) => void;
  cancel: (jobId: string) => void;
  deleteHistoryItem: (jobId: string) => void;
  clearHistory: () => void;
};

export function useDownloadQueue(): UseDownloadQueueReturn {
  const queryClient = useQueryClient();

  useEffect(() => {
    return initSocket(queryClient);
  }, [queryClient]);

  const activeQuery = useQuery({
    queryKey: ["dashboard", "active-jobs"],
    queryFn: () => api<Paginated<ApiJobSummary>>("/dashboard/active-jobs?page=1&limit=20"),
    refetchInterval: 3000,
  });

  const recentQuery = useQuery({
    queryKey: ["dashboard", "history"],
    queryFn: () => api<Paginated<ApiJobSummary>>("/dashboard/history?page=1&limit=3"),
  });

  const activeJobs = activeQuery.data?.data ?? [];
  const recentJobs = (recentQuery.data?.data ?? []).filter(
    (j) => j.status === "done" || j.status === "failed",
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["project-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["project"] });
    queryClient.invalidateQueries({ queryKey: ["history"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const onError = (error: Error) =>
    useToastStore.getState().push(error.message, "error");

  const retryMutation = useMutation({
    mutationFn: (jobId: string) =>
      api<ApiJob>(`/jobs/${jobId}/retry`, { method: "POST" }),
    onSuccess: invalidateAll,
    onError,
  });

  const cancelMutation = useMutation({
    mutationFn: (jobId: string) =>
      api<ApiJob>(`/jobs/${jobId}/cancel`, { method: "POST" }),
    onSuccess: invalidateAll,
    onError,
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: (jobId: string) =>
      api<void>(`/dashboard/history/${jobId}`, { method: "DELETE" }),
    onSuccess: invalidateAll,
    onError,
  });

  const clearHistoryMutation = useMutation({
    mutationFn: () => api<{ count: number }>("/dashboard/history", { method: "DELETE" }),
    onSuccess: invalidateAll,
    onError,
  });

  return {
    activeJobs,
    recentJobs,
    activeCount: activeJobs.length,
    isLoading: activeQuery.isLoading || recentQuery.isLoading,
    retry: retryMutation.mutate,
    cancel: cancelMutation.mutate,
    deleteHistoryItem: deleteHistoryMutation.mutate,
    clearHistory: clearHistoryMutation.mutate,
  };
}
