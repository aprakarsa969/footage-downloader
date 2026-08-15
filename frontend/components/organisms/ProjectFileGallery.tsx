"use client";

import { ExternalLink, FileVideo, Play, Trash2 } from "lucide-react";

import { Icon } from "@/components/atoms/Icon";
import { formatRelativeTime } from "@/lib/date";
import type { ApiDriveFile } from "@/types/api";

const VIDEO_MIMES = /^video\//;
const IMAGE_MIMES = /^image\//;

function formatFileSize(bytes: string | null): string {
  if (!bytes) return "";
  const b = Number(bytes);
  if (Number.isNaN(b)) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function isVideo(mime: string): boolean {
  return VIDEO_MIMES.test(mime);
}

function isImage(mime: string): boolean {
  return IMAGE_MIMES.test(mime);
}

export type ProjectFileGalleryProps = {
  files: ApiDriveFile[];
  onDeleteFile?: (file: ApiDriveFile) => void;
  onPreviewFile?: (file: ApiDriveFile) => void;
};

export function ProjectFileGallery({ files, onDeleteFile, onPreviewFile }: ProjectFileGalleryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {files.map((file) => {
        const playable = isVideo(file.mimeType) || isImage(file.mimeType);
        return (
          <div
            key={file.id}
            className="glass-card group rounded-2xl p-4 transition-all duration-hover hover:border-primary/30"
          >
            {/* Thumbnail or fallback */}
            {file.thumbnailLink && isImage(file.mimeType) ? (
              <button
                type="button"
                onClick={() => onPreviewFile?.(file)}
                className="relative block aspect-video w-full overflow-hidden rounded-card bg-bg-card"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.thumbnailLink}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              </button>
            ) : file.thumbnailLink && isVideo(file.mimeType) ? (
              <button
                type="button"
                onClick={() => onPreviewFile?.(file)}
                className="relative block aspect-video w-full overflow-hidden rounded-card bg-bg-card"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.thumbnailLink}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-hover group-hover:opacity-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-bg-base">
                    <Icon icon={Play} size={24} className="ml-0.5" />
                  </div>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={playable ? () => onPreviewFile?.(file) : undefined}
                className="flex aspect-video w-full items-center justify-center rounded-card bg-bg-elevated"
                disabled={!playable}
              >
                <Icon icon={FileVideo} size={32} className="text-text-muted" />
              </button>
            )}

            {/* File info */}
            <div className="mt-3 min-w-0">
              <h4 className="truncate text-body font-medium text-text-primary" title={file.name}>
                {file.name}
              </h4>
              <div className="mt-1 flex items-center gap-2">
                {formatFileSize(file.size) ? (
                  <span className="text-helper text-text-muted">
                    {formatFileSize(file.size)}
                  </span>
                ) : null}
                <span className="text-helper text-text-muted">
                  {formatRelativeTime(file.createdTime)}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
              {file.webViewLink ? (
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open in Drive"
                  className="inline-flex items-center gap-1.5 rounded-button text-text-secondary transition-colors duration-hover hover:text-primary"
                >
                  <span className="text-helper font-medium">Open in Drive</span>
                  <Icon icon={ExternalLink} size={12} />
                </a>
              ) : (
                <span />
              )}
              {onDeleteFile ? (
                <button
                  type="button"
                  onClick={() => onDeleteFile(file)}
                  aria-label={`Delete ${file.name}`}
                  className="rounded-button p-1.5 text-text-muted transition-colors duration-hover hover:text-status-danger"
                >
                  <Icon icon={Trash2} size={14} />
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
