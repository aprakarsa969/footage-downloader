"use client";

import { FolderKanban, HardDrive, History, LayoutDashboard, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import logo from "@/app/logo.png";
import { Icon } from "@/components/atoms/Icon";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Drive", href: "/drive-accounts", icon: HardDrive },
  { label: "History", href: "/history", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="m-4 flex h-[calc(100vh-2rem)] w-[280px] shrink-0 flex-col justify-between rounded-dropdown border border-border bg-bg-surface/70 p-6 shadow-lg backdrop-blur-xl">
      <div className="space-y-1">
        <Link href="/dashboard" className="mb-8 block">
          <Image
            src={logo}
            alt="Footage Downloader"
            width={59}
            height={32}
            className="shrink-0"
            priority
          />
          <span className="mt-1 block font-heading text-helper font-semibold leading-tight">
            <span className="bg-gradient-to-r from-primary to-status-info bg-clip-text text-transparent">
              Footage Downloader
            </span>
          </span>
          <span className="mt-0.5 block text-helper text-text-muted">Premium SaaS</span>
        </Link>
        {navItems.map(({ label, href, icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-button px-3 py-2.5 text-caption transition-all duration-hover",
              isActive(href)
                ? "border-l-4 border-primary bg-primary/10 font-semibold text-primary"
                : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
            )}
          >
            <Icon icon={icon} size={18} />
            {label}
          </Link>
        ))}
      </div>
      <div className="space-y-1 border-t border-border pt-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-button px-3 py-2.5 text-caption text-text-secondary transition-colors duration-hover hover:text-text-primary"
        >
          <Icon icon={Settings} size={18} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
