"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { MonoText } from "@/components/atoms/MonoText";
import { HistoryCardList } from "@/components/organisms/HistoryCardList";
import { PlatformIcon } from "@/components/molecules/PlatformIcon";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { ThumbnailPreview } from "@/components/molecules/ThumbnailPreview";
import { formatRelativeTime } from "@/lib/date";
import type { HistoryEntry } from "@/types/history";

export type HistoryTableProps = {
  entries: HistoryEntry[];
  onRetry?: (entry: HistoryEntry) => void;
  bare?: boolean;
  compact?: boolean;
};

export function HistoryTable({ entries, onRetry, bare, compact }: HistoryTableProps) {
  const table = (
    <>
      <div
        className={
          bare
            ? "hidden overflow-x-auto md:block"
            : "hidden overflow-x-auto rounded-card border border-border bg-bg-card shadow-card md:block"
        }
      >
      <table className={`w-full text-left ${compact ? "" : "min-w-[720px]"}`}>
        <thead>
          <tr className="border-b border-border text-caption text-text-muted">
            <th className="px-4 py-3 font-medium">Video</th>
            <th className="px-4 py-3 font-medium">Project</th>
            {!compact ? <th className="px-4 py-3 font-medium">Platform</th> : null}
            {!compact ? <th className="px-4 py-3 font-medium">Mode &amp; Resolusi</th> : null}
            <th className="px-4 py-3 font-medium">Status</th>
            {!compact ? <th className="px-4 py-3 font-medium">Tanggal</th> : null}
            <th className="px-4 py-3 font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-border last:border-b-0 hover:bg-bg-surface">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {!compact && entry.thumbnailUrl ? (
                    <ThumbnailPreview src={entry.thumbnailUrl} className="w-20 shrink-0" />
                  ) : null}
                  <Link
                    href={`/jobs/${entry.id}`}
                    className="block max-w-[220px] truncate text-body text-text-primary transition-colors duration-hover hover:text-primary"
                  >
                    {entry.videoTitle ?? entry.url}
                  </Link>
                </div>
              </td>
              <td className="max-w-[140px] truncate px-4 py-3 text-caption text-text-secondary">
                {entry.projectName ?? "—"}
              </td>
              {!compact ? (
                <td className="px-4 py-3">
                  <PlatformIcon platform={entry.platform} />
                </td>
              ) : null}
              {!compact ? (
                <td className="px-4 py-3">
                  <MonoText className="text-helper text-text-secondary">
                    {entry.mode === "timestamp" ? "Timestamp" : "Full"}
                    {entry.resolution ? ` · ${entry.resolution}` : ""}
                  </MonoText>
                </td>
              ) : null}
              <td className="px-4 py-3">
                <StatusBadge status={entry.status} size="sm" />
                {compact ? (
                  <p className="mt-1 text-helper text-text-muted">
                    {formatRelativeTime(entry.createdAt)}
                  </p>
                ) : null}
              </td>
              {!compact ? (
                <td className="px-4 py-3 text-caption text-text-muted">
                  {formatRelativeTime(entry.createdAt)}
                </td>
              ) : null}
              <td className="px-4 py-3">
                {entry.status === "failed" && onRetry ? (
                  <Button size="sm" variant="secondary" onClick={() => onRetry(entry)}>
                    Retry
                  </Button>
                ) : entry.status === "done" && entry.driveFileUrl ? (
                  <a
                    href={entry.driveFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Buka file di Drive"
                    className="inline-flex rounded-button p-2 text-text-secondary transition-colors duration-hover hover:text-primary"
                  >
                    <Icon icon={ExternalLink} size={18} />
                  </a>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div className="md:hidden">
        <HistoryCardList entries={entries} onRetry={onRetry} />
      </div>
    </>
  );
  return table;
}
