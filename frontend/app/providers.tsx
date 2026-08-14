"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ToastHost } from "@/components/molecules/ToastHost";
import { useJobProgress } from "@/hooks/useJobProgress";
import { queryClient } from "@/lib/queryClient";

function GlobalEffects() {
  useJobProgress();
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
