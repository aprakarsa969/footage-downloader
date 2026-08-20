"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { api, getToken } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { createJobSyncAdapter } from "@/lib/jobSyncAdapter";
import { useSession } from "@/stores/session";
import { useToastStore } from "@/stores/toast";
import type { ApiJob, ApiJobSummary, Paginated } from "@/types/api";

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

  const activeQuery = useQuery({
    queryKey: ["dashboard", "active-jobs"],
    queryFn: () => api<Paginated<ApiJobSummary>>("/dashboard/active-jobs?page=1&limit=20"),
    refetchInterval: (query) => {
      if (!getToken()) return false;
      const hasActive = (query.state.data?.total ?? 0) > 0;
      if (!hasActive) return false;
      return getSocket().connected ? false : 3000;
    },
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

/** Subscribe socket saat token ada; re-subscribe otomatis setelah login (token reaktif). */
export function useSocketSync(): void {
  const queryClient = useQueryClient();
  const { token } = useSession();
  useEffect(() => {
    if (!token) return;
    return createJobSyncAdapter().subscribe(getSocket(), queryClient);
  }, [token, queryClient]);
}
