"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import { Navbar } from "@/components/organisms/Navbar";
import { NotificationPanel } from "@/components/organisms/NotificationPanel";
import { Sidebar } from "@/components/organisms/Sidebar";
import { getUser } from "@/lib/api";
import { useNotifications } from "@/hooks/useNotifications";
import type { ApiUser } from "@/types/api";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { query: notificationsQuery, notifications, markRead, markAllRead } =
    useNotifications({ unreadOnly });

  if (notificationsQuery.isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base">
        <Spinner size="lg" />
        <p className="text-body text-text-secondary">Memuat notifikasi...</p>
      </div>
    );
  }

  if (notificationsQuery.isError) {
    const error = notificationsQuery.error;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base p-6">
        <div className="w-full max-w-md rounded-card border border-status-danger bg-bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Icon icon={AlertCircle} size={18} className="text-status-danger" />
            <h2 className="font-heading text-card-title text-text-primary">
              Gagal memuat notifikasi
            </h2>
          </div>
          <p className="mt-2 text-body text-text-secondary">
            {error instanceof Error ? error.message : "Terjadi kesalahan"}
          </p>
          <Button
            className="mt-4"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["notifications"] })
            }
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const user = getUser<ApiUser>();
  const userName = user?.name || "Pengguna";

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={userName} userAvatar={user?.avatar_url ?? undefined} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="w-full flex-1 space-y-6 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-page-title text-text-primary">Notifikasi</h1>
            <label className="flex cursor-pointer items-center gap-2 text-caption text-text-secondary">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Hanya belum dibaca
            </label>
          </div>

          <NotificationPanel
            notifications={notifications}
            onMarkAllRead={() => markAllRead.mutate()}
            onItemClick={(notification) => {
              if (!notification.isRead) {
                markRead.mutate(notification.id);
              }
            }}
            className="w-full max-h-none"
          />
        </main>
      </div>
    </div>
  );
}
