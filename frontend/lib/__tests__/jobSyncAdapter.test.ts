import { QueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useToastStore } from "@/stores/toast";
import type { ApiJobSummary } from "@/types/api";

import { createJobSyncAdapter } from "../jobSyncAdapter";

function makeSocket() {
  const handlers: Record<string, (payload: unknown) => void> = {};
  return {
    handlers,
    on: vi.fn((event: string, fn: (payload: unknown) => void) => {
      handlers[event] = fn;
    }),
    off: vi.fn((event: string, fn: (payload: unknown) => void) => {
      if (handlers[event] === fn) delete handlers[event];
    }),
    emit(event: string, payload: unknown) {
      handlers[event]?.(payload);
    },
  };
}

describe("jobSyncAdapter", () => {
  let qc: QueryClient;
  let socket: ReturnType<typeof makeSocket>;

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    socket = makeSocket();
    useToastStore.setState({ toasts: [] });
  });

  it("subscribes four socket event handlers", () => {
    createJobSyncAdapter().subscribe(socket as unknown as Socket, qc);
    expect(socket.on).toHaveBeenCalledTimes(4);
    expect(socket.handlers["job:progress"]).toBeTypeOf("function");
    expect(socket.handlers["batch:completed"]).toBeTypeOf("function");
  });

  it("cleanup detaches all handlers", () => {
    const unsubscribe = createJobSyncAdapter().subscribe(socket as unknown as Socket, qc);
    unsubscribe();
    expect(socket.off).toHaveBeenCalledTimes(4);
    expect(Object.keys(socket.handlers)).toHaveLength(0);
  });

  it("job:progress patches the active-jobs cache", () => {
    qc.setQueryData(["dashboard", "active-jobs"], [
      {
        id: "j1",
        project_id: "p1",
        project_name: "Proj",
        video_title: "Vid",
        source_url: "https://x",
        platform: "tiktok",
        thumbnail_url: null,
        status: "processing",
        progress_percent: 0,
        stage: null,
        drive_file_url: null,
        error_message: null,
      },
    ]);
    createJobSyncAdapter().subscribe(socket as unknown as Socket, qc);
    socket.emit("job:progress", {
      job_id: "j1",
      project_id: "p1",
      status: "processing",
      progress_percent: 42,
      stage: "uploading",
    });
    const data = qc.getQueryData<ApiJobSummary[]>(["dashboard", "active-jobs"]);
    expect(data?.[0].progress_percent).toBe(42);
  });

  it("batch:completed invalidates cache and pushes a toast", () => {
    const spy = vi.spyOn(qc, "invalidateQueries");
    createJobSyncAdapter().subscribe(socket as unknown as Socket, qc);
    socket.emit("batch:completed", {
      batch_id: "b1",
      project_id: "p1",
      total: 3,
      done: 2,
      failed: 1,
    });
    const keys = spy.mock.calls.map(
      (call) => (call[0] as { queryKey: unknown[] }).queryKey,
    );
    expect(keys).toEqual(expect.arrayContaining([["dashboard"], ["projects"]]));
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].variant).toBe("error");
  });
});
