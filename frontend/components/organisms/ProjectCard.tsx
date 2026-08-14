import { ExternalLink } from "lucide-react";
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
    <div className="relative rounded-card border border-border bg-bg-card p-6 shadow-card transition-all duration-hover hover:scale-[1.01] hover:border-border-hover hover:shadow-card-hover">
      <Link href={`/projects/${id}`} className="block">
        <h3 className="font-heading text-card-title text-text-primary">{name}</h3>
        <p className="mt-1 text-caption text-text-muted">
          {footageCount} footage
        </p>
        {driveAccountEmail ? (
          <p className="mt-0.5 truncate text-helper text-text-muted">{driveAccountEmail}</p>
        ) : null}
        <p className="mt-0.5 text-helper text-text-muted">{formatRelativeTime(createdAt)}</p>
      </Link>
      {driveFolderUrl ? (
        <a
          href={driveFolderUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Buka folder Drive"
          className="absolute right-4 top-4 rounded-button p-2 text-text-muted transition-colors duration-hover hover:text-primary"
        >
          <Icon icon={ExternalLink} size={18} />
        </a>
      ) : null}
    </div>
  );
}
