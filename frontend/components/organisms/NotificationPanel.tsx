"use client";

import { BellOff } from "lucide-react";

import { Button } from "@/components/atoms/Button";
import { EmptyState } from "@/components/molecules/EmptyState";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/date";
import type { AppNotification } from "@/types/notification";

export type NotificationPanelProps = {
  notifications: AppNotification[];
  onMarkAllRead?: () => void;
  onItemClick?: (notification: AppNotification) => void;
  className?: string;
};

export function NotificationPanel({
  notifications,
  onMarkAllRead,
  onItemClick,
  className,
}: NotificationPanelProps) {
  return (
    <div className={cn("w-80 max-h-96 overflow-y-auto rounded-dropdown border border-border bg-bg-elevated shadow-card", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-heading text-caption text-text-primary">Notifikasi</h3>
        {notifications.length > 0 ? (
          <Button size="sm" variant="ghost" onClick={onMarkAllRead} disabled={!onMarkAllRead}>
            Tandai semua sudah dibaca
          </Button>
        ) : null}
      </div>
      {notifications.length === 0 ? (
        <div className="p-4">
          <EmptyState icon={BellOff} title="Belum ada notifikasi" />
        </div>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id}>
              <button
                type="button"
                onClick={() => onItemClick?.(notification)}
                disabled={!onItemClick}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-hover hover:bg-bg-surface"
              >
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    notification.isRead ? "bg-bg-elevated" : "bg-primary"
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className={cn("block text-caption", notification.isRead ? "text-text-secondary" : "font-medium text-text-primary")}>
                    {notification.message}
                  </span>
                  <span className="mt-0.5 block text-helper text-text-muted">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
