"use client";

import { FolderOpen, HardDrive, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { EmptyState } from "@/components/molecules/EmptyState";
import { FloatingActionButton } from "@/components/molecules/FloatingActionButton";
import { ActiveJobsList } from "@/components/organisms/ActiveJobsList";
import { HistoryTable } from "@/components/organisms/HistoryTable";
import { Navbar } from "@/components/organisms/Navbar";
import { ProjectList } from "@/components/organisms/ProjectList";
import { Sidebar } from "@/components/organisms/Sidebar";
import { SummaryCardGroup, type DashboardSummary } from "@/components/organisms/SummaryCardGroup";
import { cn } from "@/lib/utils";
import type { HistoryEntry } from "@/types/history";
import type { Job } from "@/types/job";
import type { Project } from "@/types/project";

export type DashboardTemplateProps = {
  userName: string;
  userAvatar?: string;
  unreadCount?: number;
  summary: DashboardSummary;
  activeJobs: Job[];
  projects: Project[];
  history: HistoryEntry[];
  onRetryJob?: (job: Job) => void;
  onCancelJob?: (job: Job) => void;
  onRetryHistory?: (entry: HistoryEntry) => void;
  onCreateProject?: () => void;
  onConnectDrive?: () => void;
};

export function DashboardTemplate({
  userName,
  userAvatar,
  unreadCount,
  summary,
  activeJobs,
  projects,
  history,
  onRetryJob,
  onCancelJob,
  onRetryHistory,
  onCreateProject,
  onConnectDrive,
}: DashboardTemplateProps) {
  const [tab, setTab] = useState<"downloads" | "history">("downloads");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar userName={userName} userAvatar={userAvatar} unreadCount={unreadCount} />
        <main className="flex flex-1 gap-6 overflow-y-auto px-4 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="mb-1 font-heading text-page-title text-text-primary">Dashboard</h1>
                <p className="text-caption text-text-muted">
                  Pusat kendali unduhan footage ke Google Drive.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={onCreateProject} icon={Plus}>
                  Buat Project Baru
                </Button>
                <Button variant="secondary" onClick={onConnectDrive} icon={HardDrive}>
                  Hubungkan Google Drive
                </Button>
              </div>
            </header>

            <section className="glass-card flex h-[300px] flex-col rounded-3xl p-6">
              <div className="mb-6 flex items-end gap-6 border-b border-border">
                <button
                  type="button"
                  onClick={() => setTab("downloads")}
                  className={cn(
                    "border-b-2 px-1 pb-2 font-heading text-caption font-semibold transition-colors duration-hover",
                    tab === "downloads"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-muted hover:text-text-primary"
                  )}
                >
                  Download Aktif
                </button>
                <button
                  type="button"
                  onClick={() => setTab("history")}
                  className={cn(
                    "border-b-2 px-1 pb-2 font-heading text-caption font-semibold transition-colors duration-hover",
                    tab === "history"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-muted hover:text-text-primary"
                  )}
                >
                  Riwayat
                </button>
                {tab === "history" ? (
                  <Link
                    href="/history"
                    className="mb-2 ml-auto text-caption text-text-secondary transition-colors duration-hover hover:text-primary"
                  >
                    Lihat semua
                  </Link>
                ) : null}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ x: tab === "downloads" ? -48 : 48, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: tab === "downloads" ? 48 : -48, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="min-h-0 flex-1 overflow-y-auto pr-1"
                >
                  {tab === "downloads" ? (
                    <ActiveJobsList
                      jobs={activeJobs}
                      onRetry={onRetryJob}
                      onCancel={onCancelJob}
                    />
                  ) : (
                    <HistoryTable
                      bare
                      compact
                      entries={history.slice(0, 5)}
                      onRetry={onRetryHistory}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-heading text-subtitle font-medium text-text-primary">
                  Project Terbaru
                </h3>
                <Link
                  href="/projects"
                  className="text-caption text-text-secondary transition-colors duration-hover hover:text-primary"
                >
                  Lihat semua
                </Link>
              </div>
              <ProjectList
                projects={projects}
                onCreate={onCreateProject}
                empty={
                  <EmptyState
                    icon={FolderOpen}
                    title="Belum ada project"
                    action={
                      <Button size="sm" onClick={onCreateProject} icon={Plus}>
                        Buat Project
                      </Button>
                    }
                  />
                }
              />
            </section>
          </div>

          <div className="flex w-80 shrink-0 flex-col gap-6">
            <SummaryCardGroup summary={summary} />
            <div className="glass-card mt-auto rounded-2xl border border-primary/15 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface shadow-sm">
                <Icon icon={HardDrive} size={20} className="text-primary" />
              </div>
              <h4 className="mb-2 text-body font-medium text-text-primary">
                Hubungkan Google Drive
              </h4>
              <p className="mb-4 text-caption text-text-muted">
                Simpan otomatis hasil download langsung ke cloud storage Anda.
              </p>
              <Button
                variant="secondary"
                onClick={onConnectDrive}
                className="w-full rounded-full"
              >
                Hubungkan Akun
              </Button>
            </div>
          </div>
        </main>
      </div>
      <FloatingActionButton onClick={onCreateProject} />
    </div>
  );
}
