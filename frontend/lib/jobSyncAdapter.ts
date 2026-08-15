// Deep Job Sync Adapter — binds Socket.IO events to React Query cache mutations.
// Single seam: subscribe to events → cache mutators. No UI hooks, no socket creation.
import type { QueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import type {
  BatchCompletedEvent,
  JobDoneEvent,
  JobFailedEvent,
  JobProgressEvent,
} from "@/types/api";
import {
  patchJobProgress,
  markJobDone,
  markJobFailed,
  handleBatchCompletion,
} from "./jobCacheMutator";

export type JobSyncAdapter = {
  subscribe(socket: Socket, queryClient: QueryClient): () => void;
};

/**
 * Deep interface: socket event → cache mutation wiring.
 * All realtime sync logic concentrated here.
 */
export function createJobSyncAdapter(): JobSyncAdapter {
  return {
    subscribe(socket, queryClient) {
      const handleProgress = (payload: JobProgressEvent) => {
        patchJobProgress(queryClient, payload.job_id, payload.progress_percent, payload.stage);
      };

      const handleDone = (payload: JobDoneEvent) => {
        markJobDone(queryClient, payload.job_id, payload.drive_file_url);
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
    },
  };
}

/** Pre-built adapter using default config. */
export const jobSyncAdapter = createJobSyncAdapter();
