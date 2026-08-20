"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";
import { useSessionStore } from "@/stores/session";

export function useLogout() {
  const router = useRouter();
  return useMutation({
    mutationFn: () => api<void>("/auth/logout", { method: "POST" }),
    onSettled: () => {
      disconnectSocket();
      useSessionStore.getState().clear();
      router.push("/login");
    },
  });
}
