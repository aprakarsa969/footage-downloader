"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import { CreateProjectModal } from "@/components/organisms/CreateProjectModal";
import { DashboardTemplate } from "@/components/templates/DashboardTemplate";
import { api, goToDriveConnect } from "@/lib/api";
import {
  mapJobSummaryToHistoryEntry,
  mapProjectToProject,
  mapSummaryToDashboardSummary,
} from "@/lib/mappers";
import { useDownloadQueue } from "@/hooks/useDownloadQueue";
import { useSession } from "@/stores/session";
import type {
  ApiDashboardSummary,
  ApiJobSummary,
  ApiProject,
  Paginated,
} from "@/types/api";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { retry } = useDownloadQueue();
  const { user } = useSession();
  const [createOpen, setCreateOpen] = useState(false);

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => api<ApiDashboardSummary>("/dashboard/summary"),
  });

  const historyQuery = useQuery({
    queryKey: ["dashboard", "history"],
    queryFn: () =>
      api<Paginated<ApiJobSummary>>("/dashboard/history?page=1&limit=20"),
  });

  const projectsQuery = useQuery({
    queryKey: ["projects", "recent"],
    queryFn: () => api<Paginated<ApiProject>>("/projects?page=1&limit=2"),
  });

  const queries = [summaryQuery, historyQuery, projectsQuery];

  if (queries.some((q) => q.isPending)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base">
        <Spinner size="lg" />
        <p className="text-body text-text-secondary">Loading dashboard...</p>
      </div>
    );
  }

  if (queries.some((q) => q.isError)) {
    const error = queries.find((q) => q.isError)?.error;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base p-6">
        <div className="w-full max-w-md rounded-card border border-status-danger bg-bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Icon icon={AlertCircle} size={18} className="text-status-danger" />
            <h2 className="font-heading text-card-title text-text-primary">
              Failed to load dashboard
            </h2>
          </div>
          <p className="mt-2 text-body text-text-secondary">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Button
            className="mt-4"
            onClick={() => queryClient.invalidateQueries()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const userName = user?.name || "User";

  return (
    <>
      <DashboardTemplate
        userName={userName}
        userAvatar={user?.avatar_url ?? undefined}
        summary={mapSummaryToDashboardSummary(summaryQuery.data!)}
        projects={(projectsQuery.data?.data ?? []).map(mapProjectToProject)}
        history={(historyQuery.data?.data ?? []).map(mapJobSummaryToHistoryEntry)}
        onRetryHistory={(entry) => retry(entry.id)}
        onCreateProject={() => setCreateOpen(true)}
        onConnectDrive={goToDriveConnect}
      />
      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
