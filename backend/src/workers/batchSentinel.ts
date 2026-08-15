// Deep Batch Completion Sentinel — guarantees exactly-once batch notification.
// Atomic lock prevents race conditions when parallel workers finish jobs simultaneously.
// ponytail: pipeline stays focused on single-job execution; sentinel owns batch completion.
import type { JobStatus } from '@prisma/client';

export type BatchSentinel = {
  notifyJobFinished(batchId: string | null, projectId: string, userId: string): Promise<void>;
};

export type BatchSentinelDeps = {
  countByBatchAndStatus: (batchId: string, statuses: JobStatus[]) => Promise<number>;
  acquireLock: (batchId: string) => Promise<boolean>;
  createNotification: (userId: string, projectId: string, batchId: string, message: string) => Promise<void>;
  batchCompleted: (userId: string, data: { batchId: string; projectId: string; total: number; done: number; failed: number }) => void;
};

/**
 * Deep interface: batch completion logic with atomic lock.
 * Only one worker processes a given batch's completion event.
 */
export function createBatchSentinel(deps: BatchSentinelDeps): BatchSentinel {
  return {
    async notifyJobFinished(batchId, projectId, userId) {
      if (!batchId) {
        return;
      }

      // 1. Fast check: still jobs pending/processing → nothing to do.
      const remaining = await deps.countByBatchAndStatus(batchId, ['pending', 'processing']);
      if (remaining > 0) {
        return;
      }

      // 2. Acquire atomic lock — only one worker proceeds.
      const locked = await deps.acquireLock(batchId);
      if (!locked) {
        return;
      }

      // 3. Double-check after lock (race window guard).
      const recheck = await deps.countByBatchAndStatus(batchId, ['pending', 'processing']);
      if (recheck > 0) {
        return;
      }

      // 4. Count final results + notify.
      const [done, failed] = await Promise.all([
        deps.countByBatchAndStatus(batchId, ['done']),
        deps.countByBatchAndStatus(batchId, ['failed']),
      ]);
      const total = done + failed;

      await deps.createNotification(
        userId,
        projectId,
        batchId,
        `Batch download selesai: ${done} sukses, ${failed} gagal`,
      );

      deps.batchCompleted(userId, { batchId, projectId, total, done, failed });
    },
  };
}
