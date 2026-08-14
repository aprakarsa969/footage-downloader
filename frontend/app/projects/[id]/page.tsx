"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { Spinner } from "@/components/atoms/Spinner";
import { Modal } from "@/components/molecules/Modal";
import { ProjectDetailTemplate } from "@/components/templates/ProjectDetailTemplate";
import { useJobActions } from "@/hooks/useJobActions";
import { api, getUser } from "@/lib/api";
import { mapJobToJob } from "@/lib/mappers";
import { useToastStore } from "@/stores/toast";
import type {
  ApiDriveAccount,
  ApiJob,
  ApiProject,
  ApiProjectDetail,
  ApiUser,
  ApiValidateResult,
  BatchCreateLink,
  BatchCreateResponse,
  Paginated,
} from "@/types/api";

function activityMessage(job: ApiJob): string {
  const title = job.video_title ?? job.source_url;
  switch (job.status) {
    case "done":
      return `${title} selesai`;
    case "failed":
      return `${title} gagal${job.error_message ? ` (${job.error_message})` : ""}`;
    case "processing":
      return `Download berjalan: ${title}`;
    case "pending":
      return `Menunggu antrian: ${title}`;
    case "cancelled":
      return `${title} dibatalkan`;
  }
}

const renameSchema = z.object({
  name: z.string().trim().min(1, "Nama project wajib diisi"),
});

type RenameProjectModalProps = {
  open: boolean;
  onClose: () => void;
  projectName: string;
  isPending: boolean;
  onSubmit: (name: string) => void;
};

function RenameProjectModal({
  open,
  onClose,
  projectName,
  isPending,
  onSubmit,
}: RenameProjectModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(renameSchema),
    defaultValues: { name: projectName },
  });

  return (
    <Modal open={open} onClose={onClose} title="Ubah Nama Project">
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => onSubmit(values.name))}
      >
        <div className="space-y-1">
          <label htmlFor="rename-project" className="text-caption text-text-secondary">
            Nama Project
          </label>
          <Input
            id="rename-project"
            autoFocus
            aria-invalid={Boolean(errors.name)}
            className={
              errors.name
                ? "border-status-danger focus:border-status-danger focus:ring-status-danger/20"
                : undefined
            }
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-helper text-status-danger">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

type DeleteProjectModalProps = {
  open: boolean;
  onClose: () => void;
  isPending: boolean;
  onConfirm: () => void;
};

function DeleteProjectModal({
  open,
  onClose,
  isPending,
  onConfirm,
}: DeleteProjectModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Hapus Project?">
      <p className="text-body text-text-secondary">
        Project akan dihapus. Folder dan file di Google Drive tidak ikut dihapus.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Batal
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? "Menghapus..." : "Hapus Project"}
        </Button>
      </div>
    </Modal>
  );
}

export default function ProjectDetailPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { retry, cancel } = useJobActions();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: () => api<ApiProjectDetail>(`/projects/${id}`),
    enabled: !!id,
  });

  const jobsQuery = useQuery({
    queryKey: ["project-jobs", id],
    queryFn: () =>
      api<Paginated<ApiJob>>(`/projects/${id}/jobs?page=1&limit=50`),
    enabled: !!id,
  });

  const driveAccountsQuery = useQuery({
    queryKey: ["drive-accounts"],
    queryFn: () => api<ApiDriveAccount[]>("/drive-accounts"),
  });

  const submitBatch = useMutation({
    mutationFn: async (links: BatchCreateLink[]) => {
      const validation = await api<ApiValidateResult[]>("/links/validate", {
        method: "POST",
        body: { urls: links.map((link) => link.url) },
      });
      const invalid = validation.filter((result) => "error" in result);
      if (invalid.length > 0) {
        throw new Error(`URL tidak valid: ${invalid.map((r) => r.url).join(", ")}`);
      }
      return api<BatchCreateResponse>(`/projects/${id}/jobs`, {
        method: "POST",
        body: { links },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      useToastStore
        .getState()
        .push(`${data.jobs.length} link ditambahkan ke antrian`);
    },
    onError: (error: Error) =>
      useToastStore.getState().push(error.message, "error"),
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) =>
      api<ApiProject>(`/projects/${id}`, {
        method: "PATCH",
        body: { name },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      useToastStore.getState().push("Nama project diperbarui");
      setRenameOpen(false);
    },
    onError: (error: Error) =>
      useToastStore.getState().push(error.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api<void>(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      useToastStore.getState().push("Project dihapus");
      router.push("/projects");
    },
    onError: (error: Error) =>
      useToastStore.getState().push(error.message, "error"),
  });

  const queries = [projectQuery, jobsQuery, driveAccountsQuery];

  if (queries.some((q) => q.isPending)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base">
        <Spinner size="lg" />
        <p className="text-body text-text-secondary">Memuat project...</p>
      </div>
    );
  }

  if (queries.some((q) => q.isError)) {
    const error = queries.find((q) => q.isError)?.error;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base p-6">
        <div className="w-full max-w-md rounded-card border border-status-danger bg-bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Icon icon={AlertCircle} size={18} className="text-status-danger" />
            <h2 className="font-heading text-card-title text-text-primary">
              Gagal memuat project
            </h2>
          </div>
          <p className="mt-2 text-body text-text-secondary">
            {error instanceof Error ? error.message : "Terjadi kesalahan"}
          </p>
          <Button
            className="mt-4"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["project", id],
              })
            }
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const user = getUser<ApiUser>();
  const userName = user?.name || "Pengguna";

  const project = projectQuery.data!;
  const jobsData = jobsQuery.data?.data ?? [];
  const jobs = jobsData.map(mapJobToJob);
  const driveAccounts = driveAccountsQuery.data ?? [];

  const account =
    driveAccounts.find((a) => a.is_default) ?? driveAccounts[0] ?? null;
  const storage = {
    usedBytes: Number(account?.storage_used_bytes ?? 0),
    totalBytes: Number(account?.storage_total_bytes ?? 0),
  };

  const recentActivity = [...jobsData]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5)
    .map((job) => ({
      id: job.id,
      message: activityMessage(job),
      createdAt: job.created_at,
    }));

  return (
    <>
      <ProjectDetailTemplate
        userName={userName}
        userAvatar={user?.avatar_url ?? undefined}
        projectName={project.name}
        driveFolderUrl={project.drive_folder_url}
        storage={storage}
        statistics={{
          pending: project.job_status_summary.pending,
          processing: project.job_status_summary.processing,
          done: project.job_status_summary.done,
          failed: project.job_status_summary.failed,
        }}
        jobs={jobs}
        recentActivity={recentActivity}
        onRetryJob={(job) => retry(job.id)}
        onCancelJob={(job) => cancel(job.id)}
        onSubmitLinks={(urls) => submitBatch.mutate(urls)}
        onRenameProject={() => setRenameOpen(true)}
        onDeleteProject={() => setDeleteOpen(true)}
      />
      <RenameProjectModal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        projectName={project.name}
        isPending={renameMutation.isPending}
        onSubmit={(name) => renameMutation.mutate(name)}
      />
      <DeleteProjectModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  );
}
