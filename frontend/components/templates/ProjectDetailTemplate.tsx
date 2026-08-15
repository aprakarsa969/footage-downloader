"use client";

import { ExternalLink, Film, FolderOpen, Pencil, RefreshCw, Trash2 } from "lucide-react";

import { Icon } from "@/components/atoms/Icon";
import { EmptyState } from "@/components/molecules/EmptyState";
import { LinkInputForm } from "@/components/organisms/LinkInputForm";
import { JobRow } from "@/components/organisms/JobRow";
import { ProjectFileGallery } from "@/components/organisms/ProjectFileGallery";
import { AppShell } from "@/components/templates/AppShell";
import type { Job } from "@/types/job";
import type { ApiDriveFile, BatchCreateLink } from "@/types/api";

export type ProjectDetailTemplateProps = {
  userName: string;
  userAvatar?: string;
  unreadCount?: number;
  projectName: string;
  driveFolderUrl?: string;
  activeJobs: Job[];
  driveFiles: ApiDriveFile[];
  onRetryJob?: (job: Job) => void;
  onCancelJob?: (job: Job) => void;
  onSubmitLinks?: (links: BatchCreateLink[]) => void;
  onRenameProject?: () => void;
  onDeleteProject?: () => void;
  onRefreshDriveFiles?: () => void;
  onDeleteFile?: (file: ApiDriveFile) => void;
  onPreviewFile?: (file: ApiDriveFile) => void;
};

export function ProjectDetailTemplate({
  userName,
  userAvatar,
  unreadCount,
  projectName,
  driveFolderUrl,
  activeJobs,
  driveFiles,
  onRetryJob,
  onCancelJob,
  onSubmitLinks,
  onRenameProject,
  onDeleteProject,
  onRefreshDriveFiles,
  onDeleteFile,
  onPreviewFile,
}: ProjectDetailTemplateProps) {
  return (
    <AppShell userName={userName} userAvatar={userAvatar} unreadCount={unreadCount}>
      <header>
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-page-title text-text-primary">
            {projectName}
          </h1>
          {onRenameProject ? (
            <button
              type="button"
              onClick={onRenameProject}
              aria-label="Rename project"
              className="rounded-button p-2 text-text-muted transition-colors duration-hover hover:text-primary"
            >
              <Icon icon={Pencil} size={18} />
            </button>
          ) : null}
          {onDeleteProject ? (
            <button
              type="button"
              onClick={onDeleteProject}
              aria-label="Delete project"
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
            Open Drive Folder
          </a>
        ) : null}
      </header>

      {/* Top Row: Add Links + Job Queue side-by-side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card-accent rounded-2xl p-6">
          <h2 className="mb-4 font-heading text-subtitle font-medium text-text-primary">
            Add Links
          </h2>
          <LinkInputForm onSubmit={onSubmitLinks} />
        </div>

        <div className="glass-card-strong rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-subtitle font-medium text-text-primary">
              Job Queue
            </h2>
            {activeJobs.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-helper font-medium text-primary">
                {activeJobs.length} {activeJobs.length === 1 ? "job" : "jobs"}
              </span>
            )}
          </div>
          {activeJobs.length === 0 ? (
            <EmptyState
              icon={Film}
              title="No active jobs"
              description="Add video links above to start downloading."
            />
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onRetry={onRetryJob ? () => onRetryJob(job) : undefined}
                  onCancel={onCancelJob ? () => onCancelJob(job) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: File Gallery (real-time from Google Drive) */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-subtitle font-medium text-text-primary">
              Project Files
            </h2>
            {driveFiles.length > 0 && (
              <span className="rounded-full bg-bg-elevated px-2.5 py-0.5 text-helper font-medium text-text-muted">
                {driveFiles.length} {driveFiles.length === 1 ? "file" : "files"}
              </span>
            )}
          </div>
          {onRefreshDriveFiles ? (
            <button
              type="button"
              onClick={onRefreshDriveFiles}
              aria-label="Refresh Drive files"
              className="rounded-button p-2 text-text-muted transition-colors duration-hover hover:text-primary"
            >
              <Icon icon={RefreshCw} size={16} />
            </button>
          ) : null}
        </div>
        {driveFiles.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No files in this project yet"
            description="Completed footage will appear here in your Drive folder gallery."
          />
        ) : (
          <ProjectFileGallery files={driveFiles} onDeleteFile={onDeleteFile} onPreviewFile={onPreviewFile} />
        )}
      </section>
    </AppShell>
  );
}
