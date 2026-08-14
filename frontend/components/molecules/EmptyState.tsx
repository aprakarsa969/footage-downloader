"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-border bg-bg-card px-6 py-12",
        className,
      )}
    >
      <Icon icon={icon} size={40} className="text-text-muted" />
      <p className="text-body text-text-secondary">{title}</p>
      {description ? (
        <p className="text-caption text-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
