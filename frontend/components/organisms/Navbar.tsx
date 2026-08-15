"use client";

import { Bell, Menu, Moon, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import { NotificationPanel } from "@/components/organisms/NotificationPanel";
import { SearchDropdown } from "@/components/organisms/SearchDropdown";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useNotifications } from "@/hooks/useNotifications";
import { useSidebarStore } from "@/stores/sidebar";

export type NavbarProps = {
  userName: string;
  userAvatar?: string;
  unreadCount?: number;
};

export function Navbar({ userName, userAvatar }: NavbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const search = useGlobalSearch();
  const { notifications, markRead, markAllRead, unreadCount } =
    useNotifications();

  // Close notification on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [notifOpen]);

  // Close search on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) {
        setSearchOpen(false);
        search.setQuery("");
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        search.setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [searchOpen, search]);

  // Keyboard shortcut ⌘K / Ctrl+K to open search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header className="m-4 flex h-14 items-center justify-between gap-4 rounded-dropdown border border-border bg-bg-surface/40 px-4 shadow-card backdrop-blur-xl md:px-6">
      <button
        type="button"
        onClick={() => useSidebarStore.getState().openMobile()}
        aria-label="Open menu"
        className="rounded-button p-2 text-text-secondary transition-colors duration-hover hover:text-text-primary md:hidden"
      >
        <Icon icon={Menu} size={18} />
      </button>

      {/* Search input */}
      <div className="relative hidden max-w-md flex-1 md:block" ref={searchRef}>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-9 w-full items-center gap-2 rounded-input border border-border bg-bg-surface/50 px-3 text-caption text-text-muted transition-colors duration-hover hover:border-border-hover hover:text-text-secondary"
        >
          <Icon icon={Search} size={14} />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="rounded bg-bg-elevated px-1.5 py-0.5 text-helper text-text-muted">⌘K</kbd>
        </button>
        {searchOpen && (
          <div className="absolute left-0 top-0 z-50 w-full">
            <div className="relative">
              <div className="flex h-9 items-center gap-2 rounded-input border border-primary bg-bg-surface px-3 shadow-lg ring-2 ring-primary/20">
                <Icon icon={Search} size={14} className="text-primary" />
                <input
                  type="text"
                  autoFocus
                  value={search.query}
                  onChange={(e) => search.setQuery(e.target.value)}
                  placeholder="Search projects & footage..."
                  className="h-full flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-muted"
                  aria-label="Global search"
                />
                {search.query && (
                  <button
                    type="button"
                    onClick={() => search.setQuery("")}
                    className="rounded p-0.5 text-text-muted hover:text-text-primary"
                  >
                    <Icon icon={X} size={14} />
                  </button>
                )}
              </div>
              <SearchDropdown
                search={search}
                onClose={() => {
                  setSearchOpen(false);
                  search.setQuery("");
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className="relative rounded-button p-2 text-text-secondary transition-colors duration-hover hover:text-text-primary"
          >
            <Icon icon={Bell} size={18} />
            {unreadCount > 0 ? (
              <Badge
                variant="danger"
                size="sm"
                className="absolute -right-1 -top-1 rounded-full bg-status-danger text-white"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            ) : null}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-dropdown border border-border bg-bg-elevated shadow-card">
              <NotificationPanel
                notifications={notifications.slice(0, 20)}
                onMarkAllRead={() => markAllRead.mutate()}
                onItemClick={(notification) => {
                  if (!notification.isRead) markRead.mutate(notification.id);
                  setNotifOpen(false);
                }}
                className="max-h-80 w-full rounded-none border-0 bg-transparent shadow-none"
              />
              <Link
                href="/notifications"
                onClick={() => setNotifOpen(false)}
                className="block border-t border-border px-4 py-2.5 text-center text-caption text-text-secondary transition-colors duration-hover hover:text-primary"
              >
                View all notifications
              </Link>
            </div>
          )}
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
          <span className="hidden text-caption text-text-primary lg:block">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
