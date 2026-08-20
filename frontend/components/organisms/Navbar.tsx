"use client";

import { ArrowDownToLine, Bell, LogOut, Search, Settings, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import logo from "@/app/logo.png";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import { JobQueuePanel } from "@/components/organisms/JobQueuePanel";
import { NotificationPanel } from "@/components/organisms/NotificationPanel";
import { SearchDropdown } from "@/components/organisms/SearchDropdown";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useDownloadQueue } from "@/hooks/useDownloadQueue";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useLogout } from "@/hooks/useLogout";
import { useNotifications } from "@/hooks/useNotifications";
import { useSession } from "@/stores/session";

export function Navbar() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const search = useGlobalSearch();
  const { notifications, markRead, markAllRead, unreadCount } = useNotifications();
  const { activeCount } = useDownloadQueue();
  const { mutate: logout } = useLogout();
  const { user, hydrated } = useSession();

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    search.setQuery("");
  }, [search]);

  const notifRef = useClickOutside<HTMLDivElement>(() => setNotifOpen(false), notifOpen);
  const queueRef = useClickOutside<HTMLDivElement>(() => setQueueOpen(false), queueOpen);
  const searchRef = useClickOutside<HTMLDivElement>(closeSearch, searchOpen);
  const profileRef = useClickOutside<HTMLDivElement>(() => setProfileOpen(false), profileOpen);

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
      {/* Mobile brand */}
      <Link href="/dashboard" className="md:hidden" aria-label="Footage Downloader">
        <Image src={logo} alt="Footage Downloader" width={28} height={28} className="shrink-0" priority />
      </Link>

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
                onClose={closeSearch}
              />
            </div>
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        {/* Download Queue */}
        <div className="relative" ref={queueRef}>
          <Link
            href="/queue"
            aria-label="Download queue"
            className="relative rounded-button p-2 text-text-secondary transition-colors duration-hover hover:text-text-primary md:hidden"
          >
            <Icon icon={ArrowDownToLine} size={18} className={activeCount > 0 ? "animate-pulse text-primary" : undefined} />
            {activeCount > 0 && (
              <Badge
                variant="info"
                size="sm"
                className="absolute -right-1 -top-1 rounded-full bg-primary text-white"
              >
                {activeCount > 99 ? "99+" : activeCount}
              </Badge>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setQueueOpen((v) => !v)}
            aria-label="Download queue"
            aria-expanded={queueOpen}
            className="relative hidden rounded-button p-2 text-text-secondary transition-colors duration-hover hover:text-text-primary md:inline-flex"
          >
            <Icon icon={ArrowDownToLine} size={18} className={activeCount > 0 ? "animate-pulse text-primary" : undefined} />
            {activeCount > 0 && (
              <Badge
                variant="info"
                size="sm"
                className="absolute -right-1 -top-1 rounded-full bg-primary text-white"
              >
                {activeCount > 99 ? "99+" : activeCount}
              </Badge>
            )}
          </button>
          {queueOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-dropdown border border-border bg-bg-elevated shadow-card">
              <JobQueuePanel onClose={() => setQueueOpen(false)} />
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative rounded-button p-2 text-text-secondary transition-colors duration-hover hover:text-text-primary md:hidden"
          >
            <Icon icon={Bell} size={18} />
            {unreadCount > 0 && (
              <Badge
                variant="danger"
                size="sm"
                className="absolute -right-1 -top-1 rounded-full bg-status-danger text-white"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className="relative hidden rounded-button p-2 text-text-secondary transition-colors duration-hover hover:text-text-primary md:inline-flex"
          >
            <Icon icon={Bell} size={18} />
            {unreadCount > 0 && (
              <Badge
                variant="danger"
                size="sm"
                className="absolute -right-1 -top-1 rounded-full bg-status-danger text-white"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
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

        {/* Profile */}
        {hydrated && (
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Menu profil"
              aria-expanded={profileOpen}
              className="flex items-center gap-2 rounded-button p-1 transition-colors duration-hover hover:text-text-primary"
            >
              <Avatar src={user?.avatar_url ?? undefined} alt={user?.name ?? "U"} size="sm" />
              {user?.name && (
                <span className="hidden max-w-[120px] truncate text-caption text-text-secondary md:inline">
                  {user.name}
                </span>
              )}
            </button>
          {profileOpen && (
            <div className="fixed right-4 top-20 z-50 w-44 overflow-hidden rounded-dropdown border border-border bg-bg-elevated p-1.5 shadow-card md:absolute md:right-0 md:top-full md:mt-2">
              <Link
                href="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-button px-3 py-2 text-caption text-text-secondary transition-colors duration-hover hover:bg-bg-card hover:text-text-primary"
              >
                <Icon icon={Settings} size={16} />
                Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-button px-3 py-2 text-caption text-status-danger transition-colors duration-hover hover:bg-bg-card"
              >
                <Icon icon={LogOut} size={16} />
                Logout
              </button>
            </div>
          )}
          </div>
        )}

      </div>
    </header>
  );
}
