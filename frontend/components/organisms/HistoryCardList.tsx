"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { ThumbnailPreview } from "@/components/molecules/ThumbnailPreview";
import type { HistoryEntry } from "@/types/history";

export type HistoryCardListProps = {
  entries: HistoryEntry[];
  onRetry?: (entry: HistoryEntry) => void;
  onDelete?: (entry: HistoryEntry) => void;
};

export function HistoryCardList({ entries, onRetry, onDelete }: HistoryCardListProps) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex gap-3 rounded-card border border-border bg-bg-card p-4 shadow-card"
        >
          {entry.thumbnailUrl ? (
            <ThumbnailPreview src={entry.thumbnailUrl} className="w-24 shrink-0" />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-body font-medium text-text-primary">
                <Link
                  href={`/jobs/${entry.id}`}
                  className="transition-colors duration-hover hover:text-primary"
                >
                  {entry.videoTitle ?? entry.url}
                </Link>
              </h3>
              <StatusBadge status={entry.status} size="sm" />
            </div>
            <p className="mt-0.5 truncate text-caption text-text-muted">
              {entry.projectName ?? "—"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {entry.status === "failed" && onRetry ? (
                <Button size="sm" variant="secondary" onClick={() => onRetry(entry)}>
                  Retry
                </Button>
              ) : entry.status === "done" && entry.driveFileUrl ? (
                <a
                  href={entry.driveFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open file in Drive"
                  className="inline-flex items-center gap-1.5 rounded-button bg-bg-surface px-3 py-2 text-caption text-text-secondary transition-colors duration-hover hover:text-primary"
                >
                  <Icon icon={ExternalLink} size={16} />
                  Open in Drive
                </a>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(entry)}
                  aria-label="Delete history item"
                  className="inline-flex items-center gap-1.5 rounded-button px-3 py-2 text-caption text-text-muted transition-colors duration-hover hover:text-status-danger"
                >
                  <Icon icon={Trash2} size={14} />
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
