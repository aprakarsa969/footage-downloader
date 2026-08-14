"use client";

import { Bell, Moon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { NotificationPanel } from "@/components/organisms/NotificationPanel";
import { useNotifications } from "@/hooks/useNotifications";

export type NavbarProps = {
  userName: string;
  userAvatar?: string;
  unreadCount?: number;
};

export function Navbar({ userName, userAvatar }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notifications, markRead, markAllRead, unreadCount } =
    useNotifications();

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <header className="m-4 flex h-16 items-center justify-between gap-4 rounded-dropdown border border-border bg-bg-surface/40 px-6 shadow-card backdrop-blur-xl">
      <div className="max-w-xl flex-1">
        <Input placeholder="Cari..." className="h-9 w-full" aria-label="Search" />
      </div>      <div className="flex items-center gap-3">
        <div className="relative" ref={containerRef}>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Notifikasi"
            aria-expanded={open}
            className="relative rounded-button p-2 text-text-secondary transition-colors duration-hover hover:text-text-primary"
          >
            <Icon icon={Bell} size={18} />
            {unreadCount > 0 ? (
              <Badge variant="danger" size="sm" className="absolute -right-1 -top-1 rounded-full bg-status-danger text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            ) : null}
          </button>
          {open ? (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-dropdown border border-border bg-bg-elevated shadow-card">
              <NotificationPanel
                notifications={notifications.slice(0, 20)}
                onMarkAllRead={() => markAllRead.mutate()}
                onItemClick={(notification) => {
                  if (!notification.isRead) markRead.mutate(notification.id);
                  setOpen(false);
                }}
                className="max-h-80 w-full rounded-none border-0 bg-transparent shadow-none"
              />
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block border-t border-border px-4 py-2.5 text-center text-caption text-text-secondary transition-colors duration-hover hover:text-primary"
              >
                Lihat semua notifikasi
              </Link>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-button p-2 text-text-secondary transition-colors duration-hover hover:text-text-primary"
          aria-label="Toggle theme"
        >
          <Icon icon={Moon} size={18} />
        </button>
        <div className="flex items-center gap-2.5 border-l border-border pl-3">
          <Avatar src={userAvatar} alt={userName} size="sm" />
          <span className="hidden text-caption text-text-primary lg:block">{userName}</span>
        </div>
      </div>
    </header>
  );
}
