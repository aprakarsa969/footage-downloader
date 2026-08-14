"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { getSocket } from "@/lib/socket";
import { getToken } from "@/lib/api";
import { useToastStore } from "@/stores/toast";
import type {
  ApiJobSummary,
  BatchCompletedEvent,
  JobDoneEvent,
  JobFailedEvent,
  JobProgressEvent,
  Paginated,
} from "@/types/api";

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

export function useJobProgress() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!getToken()) return;
    const socket = getSocket();

    const handleProgress = (payload: JobProgressEvent) => {
      const { job_id, progress_percent, stage } = payload;
      queryClient.setQueriesData<JobListData>(
        { queryKey: ["dashboard", "active-jobs"] },
        (data) =>
          patchJobInData(data, job_id, (job) => ({
            ...job,
            progress_percent,
            ...(stage ? { stage } : {}),
          })),
      );
      queryClient.setQueriesData<JobListData>(
        { queryKey: ["project-jobs"] },
        (data) =>
          patchJobInData(data, job_id, (job) => ({
            ...job,
            progress_percent,
            ...(stage ? { stage } : {}),
          })),
      );
    };

    const handleDone = (payload: JobDoneEvent) => {
      const { job_id, drive_file_url } = payload;
      queryClient.setQueriesData<JobListData>(
        { queryKey: ["dashboard", "active-jobs"] },
        (data) => removeJobFromData(data, job_id),
      );
      queryClient.setQueriesData<JobListData>(
        { queryKey: ["project-jobs"] },
        (data) =>
          patchJobInData(data, job_id, (job) => ({
            ...job,
            status: "done",
            progress_percent: 100,
            drive_file_url,
          })),
      );
    };

    const handleFailed = (payload: JobFailedEvent) => {
      const { job_id, error_message } = payload;
      queryClient.setQueriesData<JobListData>(
        { queryKey: ["dashboard", "active-jobs"] },
        (data) => removeJobFromData(data, job_id),
      );
      queryClient.setQueriesData<JobListData>(
        { queryKey: ["project-jobs"] },
        (data) =>
          patchJobInData(data, job_id, (job) => ({
            ...job,
            status: "failed",
            error_message,
          })),
      );
    };

    const handleBatchCompleted = (payload: BatchCompletedEvent) => {
      const { project_id, done, failed } = payload;
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["project", project_id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      useToastStore.getState().push(
        `Batch selesai — ${done} selesai, ${failed} gagal`,
        failed > 0 ? "error" : "success",
      );
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
  }, [queryClient]);
}
