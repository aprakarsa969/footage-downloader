"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ToastHost } from "@/components/molecules/ToastHost";
import { useDownloadQueue } from "@/hooks/useDownloadQueue";
import { queryClient } from "@/lib/queryClient";

function GlobalEffects() {
  useDownloadQueue();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <GlobalEffects />
      <ToastHost />
    </QueryClientProvider>
  );
}
