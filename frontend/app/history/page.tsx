"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, History, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { MonoText } from "@/components/atoms/MonoText";
import { Select } from "@/components/atoms/Select";
import { Spinner } from "@/components/atoms/Spinner";
import { EmptyState } from "@/components/molecules/EmptyState";
import { HistoryTable } from "@/components/organisms/HistoryTable";
import { AppShell } from "@/components/templates/AppShell";
import { api, getUser } from "@/lib/api";
import { mapJobSummaryToHistoryEntry } from "@/lib/mappers";
import { cn } from "@/lib/utils";
import { useDownloadQueue } from "@/hooks/useDownloadQueue";
import type { ApiJobSummary, ApiProject, ApiUser, Paginated } from "@/types/api";
import type { JobStatus } from "@/types/job";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: JobStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "done", label: "Done" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

function toIso(date: string, endOfDay: boolean): string {
  return new Date(`${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`).toISOString();
}

const dateInputClassName =
  "h-12 flex-1 min-w-[160px] rounded-input border border-border bg-bg-surface px-3 text-body text-text-primary [color-scheme:dark] placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors duration-hover cursor-pointer";

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const { retry, deleteHistoryItem, clearHistory } = useDownloadQueue();
  const [status, setStatus] = useState("");
  const [projectId, setProjectId] = useState("");
  const [platform, setPlatform] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

  const handleDeleteItem = (entry: { id: string }) => {
    deleteHistoryItem(entry.id);
  };

  const handleClearHistory = () => {
    clearHistory();
    setShowClearConfirm(false);
  };

  if (historyQuery.isPending) {
    return (
      <AppShell userName="">
        <div className="flex h-full items-center justify-center gap-4">
          <Spinner size="lg" />
          <p className="text-body text-text-secondary">Loading history...</p>
        </div>
      </AppShell>
    );
  }

  if (historyQuery.isError) {
    const error = historyQuery.error;
    return (
      <AppShell userName="">
        <div className="flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <Icon icon={AlertCircle} size={18} className="text-status-danger" />
              <h2 className="font-heading text-card-title text-text-primary">
                Failed to load history
              </h2>
            </div>
            <p className="mt-2 text-body text-text-secondary">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
            <Button
              className="mt-4"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["history"] })
              }
            >
              Try Again
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const user = getUser<ApiUser>();
  const userName = user?.name || "User";

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
    <AppShell userName={userName} userAvatar={user?.avatar_url ?? undefined}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-page-title text-text-primary">Download History</h1>
          <p className="mt-1 text-body text-text-muted">Browse, filter, and retry past video download jobs.</p>
        </div>
        <Button
          size="sm"
          variant="danger"
          onClick={() => setShowClearConfirm(true)}
          className="shrink-0"
        >
          <Icon icon={Trash2} size={14} className="mr-1.5" />
          Clear History
        </Button>
      </div>

      {showClearConfirm && (
        <div className="glass-card rounded-2xl border border-status-danger/30 bg-status-danger/5 p-4">
          <p className="text-body text-text-primary">
            Delete all finished, failed, and cancelled history? Active downloads will not be affected.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" variant="danger" onClick={handleClearHistory}>
              Yes, Clear All
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="glass-card-accent rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={status}
            onChange={(val) => resetPage(setStatus)(val)}
            aria-label="Filter status"
            options={STATUS_OPTIONS}
            className="w-36 flex-1 min-w-0 md:flex-none"
          />

          <Select
            value={projectId}
            onChange={(val) => resetPage(setProjectId)(val)}
            aria-label="Filter project"
            options={[
              { value: "", label: "All projects" },
              ...projects.map((project) => ({
                value: project.id,
                label: project.name,
              })),
            ]}
            className="w-48 flex-1 min-w-0 md:flex-none"
          />

          <Select
            value={platform}
            onChange={(val) => resetPage(setPlatform)(val)}
            aria-label="Filter platform"
            options={[
              { value: "", label: "All platforms" },
              ...platforms.map((value) => ({
                value,
                label: value,
              })),
            ]}
            className="hidden w-40 md:block"
          />

          <input
            type="date"
            className={cn(dateInputClassName, "hidden md:flex")}
            value={from}
            onChange={(e) => resetPage(setFrom)(e.target.value)}
            aria-label="From date"
          />
          <input
            type="date"
            className={cn(dateInputClassName, "hidden md:flex")}
            value={to}
            onChange={(e) => resetPage(setTo)(e.target.value)}
            aria-label="To date"
          />

          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="No matching history"
          description="Try adjusting your filters"
          action={
            hasFilters ? (
              <Button size="sm" variant="secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <HistoryTable
          entries={entries}
          onRetry={(entry) => retry(entry.id)}
          onDelete={handleDeleteItem}
        />
      )}

      <div className="flex items-center justify-between">
        <MonoText className="text-caption text-text-muted">
          {total} items
        </MonoText>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <MonoText className="text-caption text-text-secondary">
            Page {page} of {totalPages}
          </MonoText>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
