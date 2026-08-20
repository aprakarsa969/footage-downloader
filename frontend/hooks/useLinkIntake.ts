"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import { useToastStore } from "@/stores/toast";
import type {
  ApiValidateResult,
  ApiValidateSuccess,
  BatchCreateLink,
  BatchCreateResponse,
} from "@/types/api";

// --- Utility functions (shared across LinkInputForm & QuickDownloadBar) ---

export type LinkResult =
  | { status: "checking" }
  | { status: "invalid"; error: string }
  | { status: "valid"; meta: ApiValidateSuccess };

export function parseTimeToSeconds(value: string): number | null {
  const match = /^(\d+):(\d{2})$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export async function validateUrl(url: string): Promise<LinkResult> {
  try {
    const [result] = await api<ApiValidateResult[]>("/links/validate", {
      method: "POST",
      body: { urls: [url] },
    });
    return "error" in result
      ? { status: "invalid", error: result.error.message }
      : { status: "valid", meta: result };
  } catch {
    return { status: "invalid", error: "Failed to check link" };
  }
}

export function toBatchLink(links: {
  url: string;
  mode: string;
  resolution: string;
  trimStart?: string;
  trimEnd?: string;
}[]): BatchCreateLink[] {
  return links.map((link) => {
    const base: BatchCreateLink = {
      url: link.url.trim(),
      mode: link.mode as "full" | "timestamp",
      resolution: link.resolution || undefined,
    };
    if (link.mode === "timestamp" && link.trimStart && link.trimEnd) {
      base.trim_start_seconds = parseTimeToSeconds(link.trimStart) ?? 0;
      base.trim_end_seconds = parseTimeToSeconds(link.trimEnd) ?? 0;
    }
    return base;
  });
}

// --- Debounced URL validation hook ---

export function useLinkValidation(urls: string[]) {
  const [results, setResults] = useState<Record<string, LinkResult>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const current = urls.map((u) => u.trim());

    Object.entries(timers.current).forEach(([url, timer]) => {
      if (!current.includes(url)) {
        clearTimeout(timer);
        delete timers.current[url];
      }
    });

    for (const url of current) {
      if (!url || timers.current[url]) continue;
      const existing = results[url];
      if (existing && existing.status !== "checking") continue;

      timers.current[url] = setTimeout(() => {
        void (async () => {
          setResults((prev) => ({ ...prev, [url]: { status: "checking" } }));
          const result = await validateUrl(url);
          setResults((prev) => ({ ...prev, [url]: result }));
          delete timers.current[url];
        })();
      }, 600);
    }
  }, [urls, results]);

  const recheck = async (url: string) => {
    if (!url) return;
    setResults((prev) => ({ ...prev, [url]: { status: "checking" } }));
    const result = await validateUrl(url);
    setResults((prev) => ({ ...prev, [url]: result }));
  };

  const clearResult = (url: string) => {
    setResults((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
  };

  return { results, recheck, clearResult };
}

// --- Batch submit mutation ---

export function useSubmitBatchLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      links,
    }: {
      projectId: string;
      links: BatchCreateLink[];
    }) => {
      return api<BatchCreateResponse>(`/projects/${projectId}/jobs`, {
        method: "POST",
        body: { links },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      useToastStore.getState().push(
        `${data.jobs.length} link(s) added to queue`,
      );
    },
    onError: (error: Error) => {
      useToastStore.getState().push(error.message, "error");
    },
  });
}
