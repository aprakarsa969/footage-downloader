"use client";

import { ExternalLink, RotateCw, X } from "lucide-react";
import Link from "next/link";

import { Icon } from "@/components/atoms/Icon";
import { PlatformIcon } from "@/components/molecules/PlatformIcon";
import { ProgressStrip } from "@/components/molecules/ProgressStrip";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { useDownloadQueue } from "@/hooks/useDownloadQueue";

type JobQueuePanelProps = {
  onClose?: () => void;
};

const stageLabel: Record<string, string> = {
  downloading: "Downloading",
  trimming: "Trimming",
  uploading: "Uploading",
};

export function JobQueuePanel({ onClose }: JobQueuePanelProps) {
  const { activeJobs, recentJobs, retry, cancel } = useDownloadQueue();

  return (
    <div className="w-80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-body font-medium text-text-primary">
          Download Queue
        </span>
        {activeJobs.length > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {activeJobs.length} active
          </span>
        )}
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="max-h-60 overflow-y-auto border-b border-border">
          {activeJobs.map((job) => (
            <div key={job.id} className="flex items-start gap-3 px-4 py-3">
              <PlatformIcon platform={job.platform} size={14} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption text-text-primary" title={job.video_title ?? job.source_url}>
                  {job.video_title ?? job.source_url}
                </p>
                <ProgressStrip percent={job.progress_percent} className="mt-1 w-full" />
                <p className="mt-0.5 text-[11px] text-text-muted">
                  {job.status === "pending" ? "Queued" : (stageLabel[job.stage ?? ""] ?? job.stage ?? "")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => cancel(job.id)}
                aria-label="Cancel download"
                className="mt-0.5 shrink-0 rounded p-1 text-text-muted transition-colors duration-hover hover:text-status-danger"
              >
                <Icon icon={X} size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty Active */}
      {activeJobs.length === 0 && (
        <div className="px-4 py-6 text-center text-helper text-text-muted">
          No active downloads
        </div>
      )}

      {/* Recent Finished */}
      {recentJobs.length > 0 && (
        <div className="max-h-48 overflow-y-auto border-b border-border">
          <div className="px-4 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Recently finished
            </span>
          </div>
          {recentJobs.map((job) => (
            <div key={job.id} className="flex items-center gap-3 px-4 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption text-text-primary" title={job.video_title ?? job.source_url}>
                  {job.video_title ?? job.source_url}
                </p>
              </div>
              <StatusBadge status={job.status} size="sm" />
              {job.status === "failed" ? (
                <button
                  type="button"
                  onClick={() => retry(job.id)}
                  aria-label="Retry download"
                  title="Retry download"
                  className="shrink-0 rounded p-1 text-text-muted transition-colors duration-hover hover:text-primary"
                >
                  <Icon icon={RotateCw} size={12} />
                </button>
              ) : null}
              {job.status === "done" && job.drive_file_url ? (
                <a
                  href={job.drive_file_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open in Drive"
                  className="shrink-0 rounded p-1 text-text-muted transition-colors duration-hover hover:text-primary"
                >
                  <Icon icon={ExternalLink} size={12} />
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <Link
        href="/history"
        onClick={onClose}
        className="block px-4 py-2.5 text-center text-caption text-text-secondary transition-colors duration-hover hover:text-primary"
      >
        View all history
      </Link>
    </div>
  );
}
