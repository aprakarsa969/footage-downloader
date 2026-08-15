import { Folder, FolderPlus } from "lucide-react";
import Link from "next/link";

import { Icon } from "@/components/atoms/Icon";
import { formatRelativeTime } from "@/lib/date";
import type { Project } from "@/types/project";

export type ProjectListProps = {
  projects: Project[];
  onCreate?: () => void;
  empty?: React.ReactNode;
  columns?: 1 | 2;
};

export function ProjectList({ projects, onCreate, empty, columns = 2 }: ProjectListProps) {
  const visibleProjects = projects.slice(0, 2);
  if (projects.length === 0) {
    if (onCreate) {
      return (
        <button
          type="button"
          onClick={onCreate}
          className="glass-card flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-5 text-center transition-colors duration-hover hover:border-primary/50"
        >
          <Icon icon={FolderPlus} size={22} className="text-text-muted" />
          <span className="text-caption text-text-secondary">Create Project</span>
        </button>
      );
    }
    return empty ?? null;
  }
  return (
    <div className={`grid gap-4 ${columns === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {visibleProjects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="glass-card group rounded-2xl p-5 transition-colors duration-hover hover:border-primary/30"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-hover group-hover:scale-110">
              <Icon icon={Folder} size={20} />
            </div>
            <span className="rounded-full bg-bg-elevated px-2 py-1 text-helper text-text-muted">
              {formatRelativeTime(project.createdAt)}
            </span>
          </div>
          <h4 className="truncate text-body font-medium text-text-primary">{project.name}</h4>
          <p className="mt-0.5 text-caption text-text-muted">
            {project.footageCount} Video
          </p>
        </Link>
      ))}
      {onCreate && visibleProjects.length < 2 ? (
        <button
          type="button"
          onClick={onCreate}
          className="glass-card group flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-5 text-center transition-colors duration-hover hover:border-primary/50"
        >
          <Icon icon={FolderPlus} size={22} className="text-text-muted" />
            <span className="text-caption text-text-secondary transition-colors duration-hover group-hover:text-primary">
              Create Project
            </span>
        </button>
      ) : null}
    </div>
  );
}
