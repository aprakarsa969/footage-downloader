import { Film } from "lucide-react";
import Link from "next/link";

import { Icon } from "@/components/atoms/Icon";
import type { Project } from "@/types/project";

export type ProjectCardProps = Project;

export function ProjectCard({ id, name, footageCount, recentThumbnails }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${id}`}
      className="glass-card group overflow-hidden rounded-card transition-colors duration-hover hover:border-primary/30"
    >
      <div className="grid h-20 grid-cols-3 gap-px bg-border/50">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative overflow-hidden bg-bg-elevated">
            {recentThumbnails[i] ? (
              <img
                src={recentThumbnails[i]}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon icon={Film} size={14} className="text-text-muted/40" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="p-3">
        <h4 className="truncate text-body font-medium text-text-primary">{name}</h4>
        <p className="mt-0.5 text-helper text-text-muted">
          {footageCount} {footageCount === 1 ? "video" : "videos"}
        </p>
      </div>
    </Link>
  );
}
