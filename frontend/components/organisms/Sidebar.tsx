"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, FolderKanban, HardDrive, History, LayoutDashboard, Settings, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import logo from "@/app/logo.png";
import { Avatar } from "@/components/atoms/Avatar";
import { Icon } from "@/components/atoms/Icon";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import type { ApiDashboardSummary } from "@/types/api";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: number;
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export type SidebarProps = {
  userName?: string;
  userAvatar?: string;
};

export function Sidebar({ userName = "", userAvatar }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggle, closeMobile } = useSidebarStore();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => api<ApiDashboardSummary>("/dashboard/summary"),
    staleTime: 30_000,
  });

  const projectsCount = summaryQuery.data?.total_projects;
  const historyCount = summaryQuery.data?.total_footage;

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/projects", icon: FolderKanban, badge: projectsCount },
    { label: "Drive", href: "/drive-accounts", icon: HardDrive },
    { label: "History", href: "/history", icon: History, badge: historyCount },
  ];

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  const sidebarContent = (
    <aside
      className={cn(
        "flex h-full flex-col justify-between rounded-dropdown border border-border bg-bg-surface/80 shadow-lg backdrop-blur-xl transition-all duration-sidebar",
        collapsed ? "w-[68px] items-center p-3" : "w-[240px] p-5",
      )}
    >
      {/* Header */}
      <div className="space-y-4">
        <div className={cn("flex items-center", collapsed ? "flex-col gap-3" : "justify-between")}>
          <Link href="/dashboard" className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
            <Image
              src={logo}
              alt="Footage Downloader"
              width={collapsed ? 24 : 28}
              height={collapsed ? 24 : 28}
              className="shrink-0"
              priority
            />
            {!collapsed && (
              <span className="font-heading text-body font-semibold leading-tight">
                <span className="bg-gradient-to-r from-primary to-status-info bg-clip-text text-transparent">
                  Footage Downloader
                </span>
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            className={cn(
              "flex items-center justify-center rounded-button text-text-muted transition-colors duration-hover hover:text-text-primary",
              collapsed ? "h-8 w-8" : "h-6 w-6",
            )}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1">
          {navItems.map(({ label, href, icon, badge }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-button px-3 py-2.5 text-caption transition-all duration-hover",
                collapsed && "justify-center px-2",
                isActive(href)
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-text-secondary hover:bg-bg-card hover:text-text-primary",
                isActive(href) && !collapsed && "border-l-[3px] border-primary pl-2.5",
              )}
            >
              <Icon icon={icon} size={18} />
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && badge !== undefined && badge > 0 && (
                <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[11px] font-medium text-text-muted">
                  {badge}
                </span>
              )}
              {collapsed && isActive(href) && (
                <span className="absolute -left-[5px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Footer: Settings + User */}
      <div className={cn("space-y-1 border-t border-border pt-3", collapsed && "border-t-0 pt-0")}>
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-button px-3 py-2.5 text-caption text-text-secondary transition-colors duration-hover hover:text-text-primary",
            collapsed && "justify-center px-2",
          )}
        >
          <Icon icon={Settings} size={18} />
          {!collapsed && <span>Settings</span>}
        </Link>

        <div
          className={cn(
            "flex items-center gap-2.5 rounded-button px-3 py-2",
            collapsed && "justify-center px-2",
          )}
        >
          <Avatar src={userAvatar} alt={getInitials(userName)} size="sm" className="!h-[26px] !w-[26px] !text-[11px]" />
          {!collapsed && userName && (
            <span className="truncate text-caption text-text-secondary">
              {userName}
            </span>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="relative hidden shrink-0 md:block">
        <div className="my-4 ml-4 h-[calc(100vh-2rem)] transition-all duration-sidebar">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={closeMobile}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[260px] md:hidden">
            <div className="relative h-full">
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Close menu"
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:text-text-primary"
              >
                <X size={16} />
              </button>
              {sidebarContent}
            </div>
          </div>
        </>
      )}
    </>
  );
}
