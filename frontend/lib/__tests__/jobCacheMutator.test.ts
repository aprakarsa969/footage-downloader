import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiJobSummary, Paginated } from "@/types/api";

import {
  handleBatchCompletion,
  markJobDone,
  markJobFailed,
  patchJobProgress,
  type JobListData,
} from "../jobCacheMutator";

function makeSummary(id: string, over: Partial<ApiJobSummary> = {}): ApiJobSummary {
  return {
    id,
    project_id: "p1",
    project_name: "Proj",
    video_title: "Vid",
    source_url: "https://x",
    platform: "tiktok",
    thumbnail_url: null,
    status: "processing",
    progress_percent: 0,
    stage: null,
    mode: "full",
    created_at: "2024-01-01T00:00:00Z",
    finished_at: null,
    drive_file_url: null,
    error_message: null,
    ...over,
  };
}

const ARRAY_KEY = ["dashboard", "active-jobs"] as const;
const PAGINATED_KEY = ["project-jobs", "p1"] as const;

describe("jobCacheMutator", () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  describe("patchJobProgress", () => {
    it("patches progress on array-shaped list", () => {
      qc.setQueryData<JobListData>(ARRAY_KEY, [makeSummary("j1")]);
      patchJobProgress(qc, "j1", 55, "uploading");
      const data = qc.getQueryData<ApiJobSummary[]>(ARRAY_KEY);
      expect(data?.[0].progress_percent).toBe(55);
      expect(data?.[0].stage).toBe("uploading");
    });

    it("patches progress on paginated-shaped list", () => {
      const paginated: Paginated<ApiJobSummary> = {
        data: [makeSummary("j1")],
        total: 1,
        page: 1,
        limit: 20,
      };
      qc.setQueryData<JobListData>(PAGINATED_KEY, paginated);
      patchJobProgress(qc, "j1", 12, "downloading");
      const data = qc.getQueryData<Paginated<ApiJobSummary>>(PAGINATED_KEY);
      expect(data?.data[0].progress_percent).toBe(12);
    });

    it("leaves other jobs untouched", () => {
      qc.setQueryData<JobListData>(ARRAY_KEY, [makeSummary("j1"), makeSummary("j2")]);
      patchJobProgress(qc, "j2", 80);
      const data = qc.getQueryData<ApiJobSummary[]>(ARRAY_KEY);
      expect(data?.[0].progress_percent).toBe(0);
      expect(data?.[1].progress_percent).toBe(80);
    });
  });

  describe("markJobDone", () => {
    it("removes job from active list and marks done in project list", () => {
      qc.setQueryData<JobListData>(ARRAY_KEY, [makeSummary("j1"), makeSummary("j2")]);
      qc.setQueryData<JobListData>(PAGINATED_KEY, [makeSummary("j1"), makeSummary("j2")]);
      markJobDone(qc, "j1", "https://drive/file", "p1");
      const active = qc.getQueryData<ApiJobSummary[]>(ARRAY_KEY);
      const project = qc.getQueryData<ApiJobSummary[]>(PAGINATED_KEY);
      expect(active?.map((j) => j.id)).toEqual(["j2"]);
      expect(project?.find((j) => j.id === "j1")?.status).toBe("done");
      expect(project?.find((j) => j.id === "j1")?.progress_percent).toBe(100);
    });
  });

  describe("markJobFailed", () => {
    it("removes from active list and stamps error in project list", () => {
      qc.setQueryData<JobListData>(ARRAY_KEY, [makeSummary("j1")]);
      qc.setQueryData<JobListData>(PAGINATED_KEY, [makeSummary("j1")]);
      markJobFailed(qc, "j1", "boom");
      const active = qc.getQueryData<ApiJobSummary[]>(ARRAY_KEY);
      const project = qc.getQueryData<ApiJobSummary[]>(PAGINATED_KEY);
      expect(active).toEqual([]);
      expect(project?.find((j) => j.id === "j1")?.error_message).toBe("boom");
    });
  });

  describe("handleBatchCompletion", () => {
    it("invalidates the batch-related query keys", () => {
      const spy = vi.spyOn(qc, "invalidateQueries");
      handleBatchCompletion(qc, "p1");
      const keys = spy.mock.calls.map(
        (call) => (call[0] as { queryKey: unknown[] }).queryKey,
      );
      expect(keys).toEqual(
        expect.arrayContaining([
          ["dashboard"],
          ["project", "p1"],
          ["projects"],
          ["notifications"],
          ["history"],
          ["project-drive-files", "p1"],
        ]),
      );
    });
  });
});
