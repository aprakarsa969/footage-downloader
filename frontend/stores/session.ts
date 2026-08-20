import { useSyncExternalStore } from "react";
import { create } from "zustand";

import { clearAuth, setToken, setUser } from "@/lib/api";
import type { ApiUser } from "@/types/api";

type SessionState = {
  user: ApiUser | null;
  token: string | null;
  setSession: (token: string, user: ApiUser) => void;
  clear: () => void;
};

function readInitial(): { token: string | null; user: ApiUser | null } {
  if (typeof window === "undefined") return { token: null, user: null };
  const token = window.localStorage.getItem("footage_token");
  let user: ApiUser | null = null;
  const raw = window.localStorage.getItem("footage_user");
  if (raw) {
    try {
      user = JSON.parse(raw) as ApiUser;
    } catch {
      user = null;
    }
  }
  return { token, user };
}

export const useSessionStore = create<SessionState>((set) => ({
  ...readInitial(),
  setSession: (token, user) => {
    setToken(token);
    setUser(user);
    set({ token, user });
  },
  clear: () => {
    clearAuth();
    set({ token: null, user: null });
  },
}));

const EMPTY_SUBSCRIBE = () => () => {};

/** Reactive current session. `hydrated` is false during SSR / first client render to avoid mismatch. */
export function useSession() {
  const user = useSessionStore((s) => s.user);
  const token = useSessionStore((s) => s.token);
  const hydrated = useSyncExternalStore(EMPTY_SUBSCRIBE, () => true, () => false);
  return { user, token, hydrated };
}
