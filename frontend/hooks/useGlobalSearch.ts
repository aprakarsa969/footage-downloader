import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { mapJobSummaryToHistoryEntry, mapProjectToProject } from "@/lib/mappers";
import type { ApiJobSummary, ApiProject, Paginated } from "@/types/api";

type SearchCategory = "projects" | "history";

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const enabled = debouncedQuery.trim().length >= 2;
  const q = encodeURIComponent(debouncedQuery);

  const projectsQuery = useQuery({
    queryKey: ["search", "projects", debouncedQuery],
    queryFn: () => api<Paginated<ApiProject>>(`/projects?page=1&limit=10&q=${q}`),
    enabled,
  });

  const historyQuery = useQuery({
    queryKey: ["search", "history", debouncedQuery],
    queryFn: () =>
      api<Paginated<ApiJobSummary>>(`/dashboard/history?page=1&limit=20&q=${q}`),
    enabled,
  });

  const isLoading = enabled && (projectsQuery.isPending || historyQuery.isPending);

  const results: SearchCategory[] = [];

  const matchedProjects = (projectsQuery.data?.data ?? [])
    .map(mapProjectToProject)
    .map((p) => ({
      id: p.id,
      name: p.name,
      footageCount: p.footageCount,
      href: `/projects/${p.id}`,
    }));

  if (matchedProjects.length > 0) results.push("projects");

  const matchedHistory = (historyQuery.data?.data ?? [])
    .map(mapJobSummaryToHistoryEntry)
    .map((h) => ({
      id: h.id,
      title: h.videoTitle ?? h.url,
      platform: h.platform,
      status: h.status,
      href: `/jobs/${h.id}`,
    }));

  if (matchedHistory.length > 0) results.push("history");

  const hasResults = matchedProjects.length > 0 || matchedHistory.length > 0;

  return {
    query,
    setQuery,
    enabled,
    isLoading,
    hasResults,
    results,
    matchedProjects,
    matchedHistory,
  };
}
