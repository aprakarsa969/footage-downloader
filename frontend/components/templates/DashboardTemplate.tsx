"use client";

import { ExternalLink, FolderPlus, Link2, SquarePlay } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { PlatformIcon } from "@/components/molecules/PlatformIcon";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { ThumbnailPreview } from "@/components/molecules/ThumbnailPreview";
import { ProjectCard } from "@/components/organisms/ProjectCard";
import { SummaryCardGroup, type DashboardSummary } from "@/components/organisms/SummaryCardGroup";
import { AppShell } from "@/components/templates/AppShell";
import { useSubmitBatchLink } from "@/hooks/useLinkIntake";
import { formatRelativeTime } from "@/lib/date";
import type { HistoryEntry } from "@/types/history";
import type { Project } from "@/types/project";

export type DashboardTemplateProps = {
  userName: string;
  userAvatar?: string;
  summary: DashboardSummary;
  projects: Project[];
  history: HistoryEntry[];
  onRetryHistory?: (entry: HistoryEntry) => void;
  onCreateProject?: () => void;
  onConnectDrive?: () => void;
};

function QuickDownloadBar({ projects }: { projects: Project[] }) {
  const [url, setUrl] = useState("");
  const { mutate: submitLink, isPending } = useSubmitBatchLink();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || projects.length === 0) return;
    submitLink(
      { projectId: projects[0].id, links: [{ url: trimmed, mode: "full", resolution: "" }] },
      { onSuccess: () => setUrl("") },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card flex items-center gap-3 rounded-card p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon icon={Link2} size={18} className="text-primary" />
      </div>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste YouTube, TikTok, or Instagram link here"
        className="min-w-0 flex-1 bg-transparent text-body text-text-primary placeholder:text-text-muted focus:outline-none"
      />
      <Button
        type="submit"
        size="sm"
        disabled={!url.trim() || isPending}
        icon={SquarePlay}
        aria-label="Download"
        title="Download"
        className="shrink-0 px-2"
      />
    </form>
  );
}

function ProjectCardGrid({ projects, onCreate }: { projects: Project[]; onCreate?: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {projects.length > 0 && <ProjectCard key={projects[0].id} {...projects[0]} />}
      {projects.slice(1, 3).map((project) => (
        <div key={project.id} className="hidden md:block">
          <ProjectCard {...project} />
        </div>
      ))}
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border p-4 transition-colors duration-hover hover:border-primary/50 md:hidden"
        >
          <Icon icon={FolderPlus} size={20} className="text-text-muted" />
          <span className="text-caption text-text-secondary">Create project</span>
        </button>
      )}
      {onCreate && projects.length < 3 && (
        <button
          type="button"
          onClick={onCreate}
          className="hidden flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border p-4 transition-colors duration-hover hover:border-primary/50 md:flex"
        >
          <Icon icon={FolderPlus} size={20} className="text-text-muted" />
          <span className="text-caption text-text-secondary">Create project</span>
        </button>
      )}
    </div>
  );
}

function HistoryListItem({
  entry,
  onRetry,
}: {
  entry: HistoryEntry;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
      {entry.thumbnailUrl ? (
        <ThumbnailPreview src={entry.thumbnailUrl} className="w-12 shrink-0 !rounded-md" />
      ) : (
        <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-bg-elevated">
          <PlatformIcon platform={entry.platform} size={14} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-body text-text-primary"
          title={entry.videoTitle ?? entry.url}
        >
          {entry.videoTitle ?? entry.url}
        </p>
        <p className="mt-0.5 text-helper text-text-muted">
          {entry.platform} · {formatRelativeTime(entry.createdAt)}
        </p>
      </div>
      <StatusBadge status={entry.status} size="sm" />
      {entry.status === "done" && entry.driveFileUrl ? (
        <a
          href={entry.driveFileUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open in Drive"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-button text-text-secondary transition-colors duration-hover hover:text-primary"
        >
          <Icon icon={ExternalLink} size={14} />
        </a>
      ) : entry.status === "failed" && onRetry ? (
        <Button size="sm" variant="ghost" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function DashboardTemplate({
  userName,
  userAvatar,
  summary,
  projects,
  history,
  onRetryHistory,
  onCreateProject,
}: DashboardTemplateProps) {
  return (
    <AppShell
      userName={userName}
      userAvatar={userAvatar}
      containerClassName="mx-auto max-w-[1400px] space-y-4"
    >
      {/* Quick Download Bar */}
      <QuickDownloadBar projects={projects} />

      {/* Summary Cards */}
      <SummaryCardGroup summary={summary} />

      {/* Projects */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-subtitle font-medium text-text-primary">
            Projects
          </h2>
          <Link
            href="/projects"
            className="text-caption text-text-secondary transition-colors duration-hover hover:text-primary"
          >
            View all
          </Link>
        </div>
        <ProjectCardGrid projects={projects} onCreate={onCreateProject} />
      </section>

      {/* Recent History */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-subtitle font-medium text-text-primary">
            Recent History
          </h2>
          <Link
            href="/history"
            className="text-caption text-text-secondary transition-colors duration-hover hover:text-primary"
          >
            View all
          </Link>
        </div>
        <div className="glass-card overflow-hidden rounded-2xl">
          {history.length === 0 ? (
            <div className="px-4 py-8 text-center text-helper text-text-muted">
              No download history yet
            </div>
          ) : (
            history.slice(0, 5).map((entry) => (
              <HistoryListItem
                key={entry.id}
                entry={entry}
                onRetry={onRetryHistory ? () => onRetryHistory(entry) : undefined}
              />
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
