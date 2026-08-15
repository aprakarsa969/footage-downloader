"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { getSocket } from "@/lib/socket";
import { getToken } from "@/lib/api";
import { jobSyncAdapter } from "@/lib/jobSyncAdapter";

export function useJobProgress() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!getToken()) return;
    const socket = getSocket();
    return jobSyncAdapter.subscribe(socket, queryClient);
  }, [queryClient]);
}
