import type { QueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";

import { useToastStore } from "@/stores/toast";
import type {
  BatchCompletedEvent,
  JobDoneEvent,
  JobFailedEvent,
  JobProgressEvent,
} from "@/types/api";

import {
  handleBatchCompletion,
  markJobDone,
  markJobFailed,
  patchJobProgress,
} from "./jobCacheMutator";

export type JobSyncAdapter = {
  subscribe(socket: Socket, queryClient: QueryClient): () => void;
};

export function createJobSyncAdapter(): JobSyncAdapter {
  return {
    subscribe(socket, queryClient) {
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
        handleBatchCompletion(queryClient, payload.project_id);
        useToastStore.getState().push(
          `Batch completed — ${payload.done} done, ${payload.failed} failed`,
          payload.failed > 0 ? "error" : "success",
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
    },
  };
}
