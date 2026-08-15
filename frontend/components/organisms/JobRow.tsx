"use client";

import { Film } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { MonoText } from "@/components/atoms/MonoText";
import { PlatformIcon } from "@/components/molecules/PlatformIcon";
import { ProgressStrip } from "@/components/molecules/ProgressStrip";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { ThumbnailPreview } from "@/components/molecules/ThumbnailPreview";
import type { Job } from "@/types/job";

const stageLabel: Record<string, string> = {
  downloading: "Downloading",
  trimming: "Trimming",
  uploading: "Uploading",
};

export type JobRowProps = {
  job: Job;
  onRetry?: () => void;
  onCancel?: () => void;
};

export function JobRow({ job, onRetry, onCancel }: JobRowProps) {
  const canCancel = job.status === "pending" || job.status === "processing";
  const showProgress = job.status === "pending" || job.status === "processing";

  return (
    <div className="glass-card group rounded-2xl p-4 transition-all duration-hover hover:border-primary/30">
      <div className="flex gap-4">
        {job.thumbnailUrl ? (
          <ThumbnailPreview src={job.thumbnailUrl} className="w-32 shrink-0" />
        ) : (
          <div className="flex w-32 shrink-0 items-center justify-center self-start rounded-xl bg-bg-elevated aspect-video">
            <Icon icon={Film} size={24} className="text-text-muted" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-body font-medium text-text-primary">
              <Link
                href={`/jobs/${job.id}`}
                className="transition-colors duration-hover hover:text-primary"
              >
                {job.videoTitle ?? job.url}
              </Link>
            </h3>
            {job.projectName ? <p className="mt-0.5 truncate text-caption text-text-muted">{job.projectName}</p> : null}
            <div className="mt-2 flex items-center gap-2">
              <PlatformIcon platform={job.platform} />
              <StatusBadge status={job.status} size="sm" />
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {showProgress ? (
              <>
                <ProgressStrip percent={job.progressPercent ?? 0} className="w-40" />
                <MonoText className="text-helper text-text-muted">
                  {job.status === "pending" ? "Queued" : (stageLabel[job.stage ?? ""] ?? job.stage ?? "")}
                </MonoText>
              </>
            ) : null}
            <div className="flex gap-2">
              {job.status === "failed" && onRetry ? (
                <Button size="sm" variant="secondary" onClick={onRetry}>
                  Retry
                </Button>
              ) : null}
              {canCancel && onCancel ? (
                <Button size="sm" variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
