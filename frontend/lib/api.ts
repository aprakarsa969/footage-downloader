import { disconnectSocket } from "@/lib/socket";
import type { ApiErrorResponse } from "@/types/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const TOKEN_STORAGE_KEY = "footage_token";

export const USER_STORAGE_KEY = "footage_user";

const AUTH_COOKIE_OPTIONS = "path=/; SameSite=Lax";

function setAuthCookie(value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_STORAGE_KEY}=${encodeURIComponent(value)}; ${AUTH_COOKIE_OPTIONS}`;
}

function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_STORAGE_KEY}=; ${AUTH_COOKIE_OPTIONS}; Max-Age=0`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function goToGoogleLogin(): void {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- target URL external (API_BASE_URL), bukan halaman Next internal
  window.location.assign(`${API_BASE_URL}/auth/google`);
}

export function goToDriveConnect(): void {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- target URL external (API_BASE_URL), bukan halaman Next internal
  window.location.assign(`${API_BASE_URL}/drive-accounts/connect`);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  setAuthCookie(token);
}

export function setUser(user: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function getUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
  clearAuthCookie();
}

export function handleUnauthorized(): void {
  clearAuth();
  disconnectSocket();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- bukan navigasi React (lib non-komponen)
    window.location.assign("/login");
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, code?: string, message?: string) {
    super(message ?? `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    let code: string | undefined;
    let message: string | undefined;
    try {
      const data = (await response.json()) as ApiErrorResponse;
      code = data.error?.code;
      message = data.error?.message;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
