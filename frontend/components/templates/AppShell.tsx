import type { ReactNode } from "react";

import { Navbar } from "@/components/organisms/Navbar";
import { Sidebar } from "@/components/organisms/Sidebar";

export type AppShellProps = {
  userName?: string;
  userAvatar?: string;
  unreadCount?: number;
  containerClassName?: string;
  children: ReactNode;
};

export function AppShell({
  userName = "",
  userAvatar,
  unreadCount,
  containerClassName = "mx-auto max-w-[1400px] space-y-6",
  children,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar userName={userName} userAvatar={userAvatar} unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto px-4 pb-4">
          <div className={containerClassName}>{children}</div>
        </main>
      </div>
    </div>
  );
}
