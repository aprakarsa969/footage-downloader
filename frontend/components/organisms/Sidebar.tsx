"use client";

import { ChevronLeft, ChevronRight, FolderKanban, HardDrive, History, LayoutDashboard, Settings, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import logo from "@/app/logo.png";
import { Icon } from "@/components/atoms/Icon";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Drive", href: "/drive-accounts", icon: HardDrive },
  { label: "History", href: "/history", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggle, closeMobile } = useSidebarStore();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

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
        "flex h-full flex-col justify-between rounded-dropdown border border-border bg-bg-surface/80 p-5 shadow-lg backdrop-blur-xl transition-all duration-sidebar",
        collapsed ? "w-[68px] items-center" : "w-[240px]",
      )}
    >
      <div className="space-y-1">
        <Link href="/dashboard" className={cn("mb-8 flex items-center gap-3", collapsed && "justify-center")}>
          <Image
            src={logo}
            alt="Footage Downloader"
            width={collapsed ? 28 : 32}
            height={collapsed ? 28 : 32}
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
        {navItems.map(({ label, href, icon }) => (
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
            {!collapsed && <span>{label}</span>}
            {collapsed && isActive(href) && (
              <span className="absolute -left-[5px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
            )}
          </Link>
        ))}
      </div>

      <div className="space-y-1 border-t border-border pt-4">
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
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute right-[-14px] top-1/2 z-30 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg-surface shadow-md transition-colors duration-hover hover:border-primary/30 hover:text-primary"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
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
