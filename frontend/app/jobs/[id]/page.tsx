"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { MonoText } from "@/components/atoms/MonoText";
import { Spinner } from "@/components/atoms/Spinner";
import { ProgressStrip } from "@/components/molecules/ProgressStrip";
import { JobRow } from "@/components/organisms/JobRow";
import { AppShell } from "@/components/templates/AppShell";
import { api, getUser } from "@/lib/api";
import { formatRelativeTime } from "@/lib/date";
import { mapJobToJob } from "@/lib/mappers";
import type { ApiJob, ApiUser } from "@/types/api";

function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-caption text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-body text-text-primary">{children}</dd>
    </div>
  );
}

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const jobQuery = useQuery({
    queryKey: ["job", id],
    queryFn: () => api<ApiJob>(`/jobs/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "processing" ? 3000 : false;
    },
  });

  const user = getUser<ApiUser>();

  if (jobQuery.isPending) {
    return (
      <AppShell userName="">
        <div className="flex h-full items-center justify-center gap-4">
          <Spinner size="lg" />
          <p className="text-body text-text-secondary">Loading job...</p>
        </div>
      </AppShell>
    );
  }

  if (jobQuery.isError) {
    const error = jobQuery.error;
    return (
      <AppShell userName="">
        <div className="flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <Icon icon={AlertCircle} size={18} className="text-status-danger" />
              <h2 className="font-heading text-card-title text-text-primary">
                Failed to load job
              </h2>
            </div>
            <p className="mt-2 text-body text-text-secondary">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
            <Button className="mt-4" onClick={() => jobQuery.refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const userName = user?.name || "User";
  const job = jobQuery.data!;
  const showProgress = job.status === "pending" || job.status === "processing";

  return (
    <AppShell userName={userName} userAvatar={user?.avatar_url ?? undefined}>
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 rounded-button text-caption text-text-secondary transition-colors duration-hover hover:text-text-primary"
      >
        <Icon icon={ArrowLeft} size={16} />
        Back
      </button>

      <h1 className="font-heading text-page-title text-text-primary">
        Job Details
      </h1>

      <JobRow job={mapJobToJob(job)} />

      {showProgress ? (
        <div className="glass-card rounded-2xl p-6 transition-all duration-hover hover:border-primary/30">
          <h2 className="mb-3 font-heading text-card-title text-text-primary">
            Progress
          </h2>
          <ProgressStrip percent={job.progress_percent ?? 0} />
          <MonoText className="mt-2 text-caption text-text-muted">
            {job.progress_percent ?? 0}%
          </MonoText>
        </div>
      ) : null}

      {job.status === "failed" && job.error_message ? (
        <div className="glass-card rounded-2xl border border-status-danger/30 p-6 transition-all duration-hover">
          <h2 className="mb-2 font-heading text-card-title text-status-danger">
            Error
          </h2>
          <p className="text-body text-text-secondary">{job.error_message}</p>
        </div>
      ) : null}

      <div className="glass-card rounded-2xl p-6 transition-all duration-hover hover:border-primary/30">
        <h2 className="mb-4 font-heading text-card-title text-text-primary">
          Information
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Source URL">
            <MonoText className="break-all text-helper">{job.source_url}</MonoText>
          </InfoItem>
          <InfoItem label="Platform">{job.platform}</InfoItem>
          <InfoItem label="Mode">
            {job.mode === "timestamp" ? "Timestamp" : "Full"}
          </InfoItem>
          <InfoItem label="Resolution">{job.resolution ?? "—"}</InfoItem>
          <InfoItem label="Duration">
            {job.duration_seconds != null
              ? `${job.duration_seconds} seconds`
              : "—"}
          </InfoItem>
          <InfoItem label="Trim">
            {job.trim_start_seconds != null || job.trim_end_seconds != null
              ? `${job.trim_start_seconds ?? 0} – ${job.trim_end_seconds ?? "end"}`
              : "—"}
          </InfoItem>
          <InfoItem label="File">
            {job.file_name ? (
              <span className="break-all">{job.file_name}</span>
            ) : (
              "—"
            )}
          </InfoItem>
          <InfoItem label="Batch ID">
            <MonoText className="break-all text-helper">{job.batch_id ?? "—"}</MonoText>
          </InfoItem>
          <InfoItem label="Created">
            {formatRelativeTime(job.created_at)}
          </InfoItem>
          {job.started_at ? (
            <InfoItem label="Started">
              {formatRelativeTime(job.started_at)}
            </InfoItem>
          ) : null}
          {job.finished_at ? (
            <InfoItem label="Finished">
              {formatRelativeTime(job.finished_at)}
            </InfoItem>
          ) : null}
        </dl>
      </div>

      {job.status === "done" && job.drive_file_url ? (
        <a
          href={job.drive_file_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-caption text-text-secondary transition-colors duration-hover hover:text-primary"
        >
          <Icon icon={ExternalLink} size={14} />
          Open file in Google Drive
        </a>
      ) : null}
    </AppShell>
  );
}
