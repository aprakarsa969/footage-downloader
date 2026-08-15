import { ExternalLink, Folder } from "lucide-react";
import Link from "next/link";

import { Icon } from "@/components/atoms/Icon";
import { formatRelativeTime } from "@/lib/date";
import type { Project } from "@/types/project";

export type ProjectCardProps = Project;

export function ProjectCard({
  id,
  name,
  footageCount,
  driveAccountEmail,
  driveFolderUrl,
  createdAt,
}: ProjectCardProps) {
  return (
    <div className="glass-card group rounded-2xl p-5 transition-all duration-hover hover:border-primary/30">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-hover group-hover:scale-110">
          <Icon icon={Folder} size={20} />
        </div>
        <span className="rounded-full bg-bg-elevated px-2.5 py-1 text-helper text-text-muted">
          {formatRelativeTime(createdAt)}
        </span>
      </div>

      <Link href={`/projects/${id}`} className="block">
        <h3 className="truncate text-body font-medium text-text-primary">{name}</h3>
        <p className="mt-1 text-caption text-text-muted">
          {footageCount} {footageCount === 1 ? "video" : "videos"}
        </p>
      </Link>

      {(driveAccountEmail || driveFolderUrl) && (
        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
          <p className="truncate text-helper text-text-muted">
            {driveAccountEmail ?? ""}
          </p>
          {driveFolderUrl ? (
            <a
              href={driveFolderUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open folder in Drive"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-button text-text-secondary transition-colors duration-hover hover:text-primary"
            >
              <span className="text-helper font-medium">Drive</span>
              <Icon icon={ExternalLink} size={14} />
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}
