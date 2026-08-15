"use client";

import { FolderOpen, HardDrive, Link2, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ActiveJobsList } from "@/components/organisms/ActiveJobsList";
import { HistoryTable } from "@/components/organisms/HistoryTable";
import { ProjectList } from "@/components/organisms/ProjectList";
import { SummaryCardGroup, type DashboardSummary } from "@/components/organisms/SummaryCardGroup";
import { AppShell } from "@/components/templates/AppShell";
import type { HistoryEntry } from "@/types/history";
import type { Job } from "@/types/job";
import type { Project } from "@/types/project";

export type DashboardTemplateProps = {
  userName: string;
  userAvatar?: string;
  unreadCount?: number;
  summary: DashboardSummary;
  activeJobs: Job[];
  projects: Project[];
  history: HistoryEntry[];
  onRetryJob?: (job: Job) => void;
  onCancelJob?: (job: Job) => void;
  onRetryHistory?: (entry: HistoryEntry) => void;
  onCreateProject?: () => void;
  onConnectDrive?: () => void;
};

export function DashboardTemplate({
  userName,
  userAvatar,
  unreadCount,
  summary,
  activeJobs,
  projects,
  history,
  onRetryJob,
  onCancelJob,
  onRetryHistory,
  onCreateProject,
  onConnectDrive,
}: DashboardTemplateProps) {
  return (
    <AppShell
      userName={userName}
      userAvatar={userAvatar}
      unreadCount={unreadCount}
      containerClassName="mx-auto max-w-[1400px] space-y-4"
    >
      <section>
        <SummaryCardGroup summary={summary} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card-strong rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-subtitle font-medium text-text-primary">
              Active Downloads
            </h2>
            {activeJobs.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-helper font-medium text-primary">
                {activeJobs.length} {activeJobs.length === 1 ? "job" : "jobs"}
              </span>
            )}
          </div>
          <ActiveJobsList
            jobs={activeJobs}
            onRetry={onRetryJob}
            onCancel={onCancelJob}
          />
        </div>

        <div className="glass-card-accent flex flex-col gap-4 rounded-2xl p-5">
          <h2 className="font-heading text-subtitle font-medium text-text-primary">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Button onClick={onCreateProject} icon={Plus} className="w-full justify-center">
              New Project
            </Button>
            <Button variant="secondary" onClick={onConnectDrive} icon={HardDrive} className="w-full justify-center">
              Connect Google Drive
            </Button>
          </div>
          <div className="mt-auto rounded-xl border border-border bg-bg-surface/50 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-bg-elevated">
              <Icon icon={Link2} size={16} className="text-primary" />
            </div>
            <p className="text-body font-medium text-text-primary">
              Ready to download?
            </p>
            <p className="mt-1 text-helper text-text-muted">
              Paste a YouTube, TikTok, or Instagram link and we&apos;ll handle the rest.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-2xl p-5">
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
          <ProjectList
            projects={projects}
            columns={1}
            onCreate={onCreateProject}
            empty={
              <EmptyState
                icon={FolderOpen}
                title="No projects yet"
                action={
                  <Button size="sm" onClick={onCreateProject} icon={Plus}>
                    Create Project
                  </Button>
                }
              />
            }
          />
        </div>

        <div className="glass-card rounded-2xl p-5 lg:col-span-2">
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
          <HistoryTable
            bare
            compact
            entries={history.slice(0, 4)}
            onRetry={onRetryHistory}
          />
        </div>
      </section>
    </AppShell>
  );
}
