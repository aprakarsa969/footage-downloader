"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, History } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { MonoText } from "@/components/atoms/MonoText";
import { Spinner } from "@/components/atoms/Spinner";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Navbar } from "@/components/organisms/Navbar";
import { HistoryTable } from "@/components/organisms/HistoryTable";
import { Sidebar } from "@/components/organisms/Sidebar";
import { api, getUser } from "@/lib/api";
import { mapJobSummaryToHistoryEntry } from "@/lib/mappers";
import { useJobActions } from "@/hooks/useJobActions";
import type { ApiJobSummary, ApiProject, ApiUser, Paginated } from "@/types/api";
import type { JobStatus } from "@/types/job";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: JobStatus | ""; label: string }[] = [
  { value: "", label: "Semua status" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "done", label: "Done" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

function toIso(date: string, endOfDay: boolean): string {
  return new Date(`${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`).toISOString();
}

const selectClassName =
  "h-12 rounded-input border border-border bg-bg-surface px-3 text-body text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const { retry } = useJobActions();
  const [status, setStatus] = useState("");
  const [projectId, setProjectId] = useState("");
  const [platform, setPlatform] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<Paginated<ApiProject>>("/projects?page=1&limit=100"),
  });

  const historyQuery = useQuery({
    queryKey: ["history", { status, projectId, platform, from, to, page }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (status) params.set("status", status);
      if (projectId) params.set("project_id", projectId);
      if (platform) params.set("platform", platform);
      if (from) params.set("from", toIso(from, false));
      if (to) params.set("to", toIso(to, true));
      return api<Paginated<ApiJobSummary>>(`/dashboard/history?${params.toString()}`);
    },
  });

  const resetPage = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  if (historyQuery.isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base">
        <Spinner size="lg" />
        <p className="text-body text-text-secondary">Memuat riwayat...</p>
      </div>
    );
  }

  if (historyQuery.isError) {
    const error = historyQuery.error;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base p-6">
        <div className="w-full max-w-md rounded-card border border-status-danger bg-bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Icon icon={AlertCircle} size={18} className="text-status-danger" />
            <h2 className="font-heading text-card-title text-text-primary">
              Gagal memuat riwayat
            </h2>
          </div>
          <p className="mt-2 text-body text-text-secondary">
            {error instanceof Error ? error.message : "Terjadi kesalahan"}
          </p>
          <Button
            className="mt-4"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["history"] })
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

  const projects = projectsQuery.data?.data ?? [];
  const data = historyQuery.data?.data ?? [];
  const total = historyQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const platforms = [...new Set(data.map((job) => job.platform))].sort();

  const entries = data.map(mapJobSummaryToHistoryEntry);

  const hasFilters = Boolean(status || projectId || platform || from || to);
  const clearFilters = () => {
    setStatus("");
    setProjectId("");
    setPlatform("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar userName={userName} userAvatar={user?.avatar_url ?? undefined} />
        <main className="w-full flex-1 space-y-6 px-4 py-4">
          <h1 className="font-heading text-page-title text-text-primary">Riwayat Download</h1>

          <div className="flex flex-wrap items-center gap-3">
            <select
              className={selectClassName}
              value={status}
              onChange={(e) => resetPage(setStatus)(e.target.value)}
              aria-label="Filter status"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className={selectClassName}
              value={projectId}
              onChange={(e) => resetPage(setProjectId)(e.target.value)}
              aria-label="Filter project"
            >
              <option value="">Semua project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              className={selectClassName}
              value={platform}
              onChange={(e) => resetPage(setPlatform)(e.target.value)}
              aria-label="Filter platform"
            >
              <option value="">Semua platform</option>
              {platforms.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <input
              type="date"
              className={selectClassName}
              value={from}
              onChange={(e) => resetPage(setFrom)(e.target.value)}
              aria-label="Dari tanggal"
            />
            <input
              type="date"
              className={selectClassName}
              value={to}
              onChange={(e) => resetPage(setTo)(e.target.value)}
              aria-label="Sampai tanggal"
            />
          </div>

          {entries.length === 0 ? (
            <EmptyState
              icon={History}
              title="Tidak ada riwayat yang cocok"
              description="Coba ubah filter pencarian"
              action={
                hasFilters ? (
                  <Button size="sm" variant="secondary" onClick={clearFilters}>
                    Bersihkan Filter
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <HistoryTable entries={entries} onRetry={(entry) => retry(entry.id)} />
          )}

          <div className="flex items-center justify-between">
            <MonoText className="text-caption text-text-muted">
              {total} item
            </MonoText>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Sebelumnya
              </Button>
              <MonoText className="text-caption text-text-secondary">
                Hal {page} dari {totalPages}
              </MonoText>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
