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
import { Navbar } from "@/components/organisms/Navbar";
import { JobRow } from "@/components/organisms/JobRow";
import { Sidebar } from "@/components/organisms/Sidebar";
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

  if (jobQuery.isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base">
        <Spinner size="lg" />
        <p className="text-body text-text-secondary">Memuat job...</p>
      </div>
    );
  }

  if (jobQuery.isError) {
    const error = jobQuery.error;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base p-6">
        <div className="w-full max-w-md rounded-card border border-status-danger bg-bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Icon icon={AlertCircle} size={18} className="text-status-danger" />
            <h2 className="font-heading text-card-title text-text-primary">
              Gagal memuat job
            </h2>
          </div>
          <p className="mt-2 text-body text-text-secondary">
            {error instanceof Error ? error.message : "Terjadi kesalahan"}
          </p>
          <Button className="mt-4" onClick={() => jobQuery.refetch()}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const user = getUser<ApiUser>();
  const userName = user?.name || "Pengguna";
  const job = jobQuery.data!;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar userName={userName} userAvatar={user?.avatar_url ?? undefined} />
        <main className="w-full flex-1 space-y-6 px-4 py-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 rounded-button text-caption text-text-secondary transition-colors duration-hover hover:text-text-primary"
          >
            <Icon icon={ArrowLeft} size={16} />
            Kembali
          </button>

          <h1 className="font-heading text-page-title text-text-primary">
            Detail Job
          </h1>

          <JobRow job={mapJobToJob(job)} />

          {job.status === "processing" ? (
            <div className="rounded-card border border-border bg-bg-card p-6 shadow-card">
              <h2 className="mb-3 font-heading text-card-title text-text-primary">
                Progres
              </h2>
              <ProgressStrip percent={job.progress_percent} />
              <MonoText className="mt-2 text-caption text-text-muted">
                {job.progress_percent}%
              </MonoText>
            </div>
          ) : null}

          {job.status === "failed" && job.error_message ? (
            <div className="rounded-card border border-status-danger bg-bg-card p-6 shadow-card">
              <h2 className="mb-2 font-heading text-card-title text-status-danger">
                Error
              </h2>
              <p className="text-body text-text-secondary">{job.error_message}</p>
            </div>
          ) : null}

          <div className="rounded-card border border-border bg-bg-card p-6 shadow-card">
            <h2 className="mb-4 font-heading text-card-title text-text-primary">
              Informasi
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="URL Sumber">
                <MonoText className="break-all text-helper">{job.source_url}</MonoText>
              </InfoItem>
              <InfoItem label="Platform">{job.platform}</InfoItem>
              <InfoItem label="Mode">
                {job.mode === "timestamp" ? "Timestamp" : "Full"}
              </InfoItem>
              <InfoItem label="Resolusi">{job.resolution ?? "—"}</InfoItem>
              <InfoItem label="Durasi">
                {job.duration_seconds != null
                  ? `${job.duration_seconds} detik`
                  : "—"}
              </InfoItem>
              <InfoItem label="Trim">
                {job.trim_start_seconds != null || job.trim_end_seconds != null
                  ? `${job.trim_start_seconds ?? 0} – ${job.trim_end_seconds ?? "akhir"}`
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
              <InfoItem label="Dibuat">
                {formatRelativeTime(job.created_at)}
              </InfoItem>
              {job.started_at ? (
                <InfoItem label="Dimulai">
                  {formatRelativeTime(job.started_at)}
                </InfoItem>
              ) : null}
              {job.finished_at ? (
                <InfoItem label="Selesai">
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
              Buka file di Google Drive
            </a>
          ) : null}
        </main>
      </div>
    </div>
  );
}
