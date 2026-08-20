"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  HardDrive,
  History,
  LayoutDashboard,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import logo from "@/app/logo.png";
import { Icon } from "@/components/atoms/Icon";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import type { ApiDashboardSummary } from "@/types/api";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Drive", href: "/drive-accounts", icon: HardDrive },
  { label: "History", href: "/history", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarStore();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => api<ApiDashboardSummary>("/dashboard/summary"),
    staleTime: 30_000,
  });

  const badgeFor = (href: string) => {
    if (href === "/projects") return summaryQuery.data?.total_projects;
    if (href === "/history") return summaryQuery.data?.total_footage;
    return undefined;
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="relative hidden shrink-0 md:block">
        <div className="my-4 ml-4 h-[calc(100vh-2rem)] transition-all duration-sidebar">
          <aside
            className={cn(
              "flex h-full flex-col justify-between rounded-dropdown border border-border bg-bg-surface/80 shadow-lg backdrop-blur-xl transition-all duration-sidebar",
              collapsed ? "w-[68px] items-center p-3" : "w-[240px] p-5",
            )}
          >
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

              <nav className="space-y-1">
                {navItems.map(({ label, href, icon }) => {
                  const active = isActive(href);
                  const badge = badgeFor(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={collapsed ? label : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-button px-3 py-2.5 text-caption transition-all duration-hover",
                        collapsed && "justify-center px-2",
                        active
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-text-secondary hover:bg-bg-card hover:text-text-primary",
                        active && !collapsed && "border-l-[3px] border-primary pl-2.5",
                      )}
                    >
                      <Icon icon={icon} size={18} />
                      {!collapsed && <span className="flex-1">{label}</span>}
                      {!collapsed && badge !== undefined && badge > 0 && (
                        <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[11px] font-medium text-text-muted">
                          {badge}
                        </span>
                      )}
                      {collapsed && active && (
                        <span className="absolute -left-[5px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-bg-surface/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {navItems.map(({ label, href, icon }) => {
          const active = isActive(href);
          const badge = badgeFor(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]",
                active ? "text-primary" : "text-text-muted",
              )}
            >
              <span className="relative">
                <Icon icon={icon} size={20} />
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 rounded-full bg-primary px-1.5 text-[9px] font-semibold leading-tight text-white">
                    {badge}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
