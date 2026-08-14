"use client";

import { ExternalLink, Film, Pencil, Trash2 } from "lucide-react";

import { Icon } from "@/components/atoms/Icon";
import { MonoText } from "@/components/atoms/MonoText";
import { EmptyState } from "@/components/molecules/EmptyState";
import { LinkInputForm } from "@/components/organisms/LinkInputForm";
import { Navbar } from "@/components/organisms/Navbar";
import { JobRow } from "@/components/organisms/JobRow";
import { Sidebar } from "@/components/organisms/Sidebar";
import { StorageBar } from "@/components/molecules/StorageBar";
import { formatRelativeTime } from "@/lib/date";
import type { Job } from "@/types/job";
import type { BatchCreateLink } from "@/types/api";

export type ProjectDetailTemplateProps = {
  userName: string;
  userAvatar?: string;
  unreadCount?: number;
  projectName: string;
  driveFolderUrl?: string;
  storage: { usedBytes: number; totalBytes: number };
  statistics: { pending: number; processing: number; done: number; failed: number };
  jobs: Job[];
  recentActivity: { id: string; message: string; createdAt: string }[];
  onRetryJob?: (job: Job) => void;
  onCancelJob?: (job: Job) => void;
  onSubmitLinks?: (links: BatchCreateLink[]) => void;
  onRenameProject?: () => void;
  onDeleteProject?: () => void;
};

export function ProjectDetailTemplate({
  userName,
  userAvatar,
  unreadCount,
  projectName,
  driveFolderUrl,
  storage,
  statistics,
  jobs,
  recentActivity,
  onRetryJob,
  onCancelJob,
  onSubmitLinks,
  onRenameProject,
  onDeleteProject,
}: ProjectDetailTemplateProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar userName={userName} userAvatar={userAvatar} unreadCount={unreadCount} />
        <main className="w-full flex-1 space-y-8 px-4 py-4">
          <header>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-page-title text-text-primary">{projectName}</h1>
            {onRenameProject ? (
              <button
                type="button"
                onClick={onRenameProject}
                aria-label="Ubah nama project"
                className="rounded-button p-2 text-text-muted transition-colors duration-hover hover:text-primary"
              >
                <Icon icon={Pencil} size={18} />
              </button>
            ) : null}
            {onDeleteProject ? (
              <button
                type="button"
                onClick={onDeleteProject}
                aria-label="Hapus project"
                className="rounded-button p-2 text-text-muted transition-colors duration-hover hover:text-status-danger"
              >
                <Icon icon={Trash2} size={18} />
              </button>
            ) : null}
          </div>
            {driveFolderUrl ? (
              <a
                href={driveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-caption text-text-secondary transition-colors duration-hover hover:text-primary"
              >
                <Icon icon={ExternalLink} size={14} />
                Buka folder Drive
              </a>
            ) : null}
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <section className="min-w-0 space-y-6">
              <div className="rounded-card border border-border bg-bg-card p-6 shadow-card">
                <h2 className="mb-4 font-heading text-card-title text-text-primary">Tambah Link</h2>
                <LinkInputForm onSubmit={onSubmitLinks} />
              </div>

              <section className="space-y-4">
                <h2 className="font-heading text-section-title text-text-primary">Job Queue</h2>
                {jobs.length === 0 ? (
                  <EmptyState
                    icon={Film}
                    title="Belum ada job dalam project ini"
                    description="Tambahkan link video untuk memulai download"
                  />
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <JobRow
                        key={job.id}
                        job={job}
                        onRetry={onRetryJob ? () => onRetryJob(job) : undefined}
                        onCancel={onCancelJob ? () => onCancelJob(job) : undefined}
                      />
                    ))}
                  </div>
                )}
              </section>
            </section>

            <aside className="min-w-0 space-y-6">
              <div className="rounded-card border border-border bg-bg-card p-6 shadow-card">
                <h2 className="mb-3 text-caption font-medium text-text-primary">Storage</h2>
                <StorageBar usedBytes={storage.usedBytes} totalBytes={storage.totalBytes} />
              </div>

              <div className="rounded-card border border-border bg-bg-card p-6 shadow-card">
                <h2 className="mb-3 text-caption font-medium text-text-primary">Statistik</h2>
                <div className="space-y-2">
                  {(
                    [
                      ["Pending", statistics.pending],
                      ["Processing", statistics.processing],
                      ["Done", statistics.done],
                      ["Failed", statistics.failed],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <span className="text-caption text-text-secondary">{label}</span>
                      <MonoText className="text-caption text-text-primary">{value}</MonoText>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-card border border-border bg-bg-card p-6 shadow-card">
                <h2 className="mb-3 text-caption font-medium text-text-primary">Aktivitas Terbaru</h2>
                {recentActivity.length === 0 ? (
                  <p className="text-caption text-text-muted">Belum ada aktivitas</p>
                ) : (
                  <ul className="space-y-3">
                    {recentActivity.map((activity) => (
                      <li key={activity.id} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-caption text-text-secondary">{activity.message}</p>
                          <p className="mt-0.5 text-helper text-text-muted">
                            {formatRelativeTime(activity.createdAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
