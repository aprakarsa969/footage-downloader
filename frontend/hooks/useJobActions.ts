import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useToastStore } from "@/stores/toast";
import type { ApiJob } from "@/types/api";

export function useJobActions() {
  const queryClient = useQueryClient();

  const invalidateJobs = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["project-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["project"] });
    queryClient.invalidateQueries({ queryKey: ["history"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const onError = (error: Error) =>
    useToastStore.getState().push(error.message, "error");

  const retryJob = useMutation({
    mutationFn: (jobId: string) =>
      api<ApiJob>(`/jobs/${jobId}/retry`, { method: "POST" }),
    onSuccess: invalidateJobs,
    onError,
  });

  const cancelJob = useMutation({
    mutationFn: (jobId: string) =>
      api<ApiJob>(`/jobs/${jobId}/cancel`, { method: "POST" }),
    onSuccess: invalidateJobs,
    onError,
  });

  return { retry: retryJob.mutate, cancel: cancelJob.mutate };
}
