"use client";

import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/molecules/EmptyState";
import { JobRow } from "@/components/organisms/JobRow";
import type { Job } from "@/types/job";

export type ActiveJobsListProps = {
  jobs: Job[];
  onRetry?: (job: Job) => void;
  onCancel?: (job: Job) => void;
};

export function ActiveJobsList({ jobs, onRetry, onCancel }: ActiveJobsListProps) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Tidak ada download yang sedang berjalan"
        description="Mulai download baru atau pantau aktivitas sebelumnya di tab Riwayat."
        className="w-full border-dashed bg-bg-card/50"
      />
    );
  }
  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <JobRow
          key={job.id}
          job={job}
          onRetry={onRetry ? () => onRetry(job) : undefined}
          onCancel={onCancel ? () => onCancel(job) : undefined}
        />
      ))}
    </div>
  );
}
