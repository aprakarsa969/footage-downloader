"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ExternalLink, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  ApiDriveFile,
  ApiJob,
  ApiProject,
  ApiProjectDetail,
  ApiUser,
  ApiValidateResult,
  BatchCreateLink,
  BatchCreateResponse,
  Paginated,
} from "@/types/api";

const renameSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
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
    <Modal open={open} onClose={onClose} title="Rename Project">
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => onSubmit(values.name))}
      >
        <div className="space-y-1">
          <label htmlFor="rename-project" className="text-caption text-text-secondary">
            Project Name
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
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
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
    <Modal open={open} onClose={onClose} title="Delete Project?">
      <p className="text-body text-text-secondary">
        This project will be deleted. Folders and files in Google Drive will not be removed.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? "Deleting..." : "Delete Project"}
        </Button>
      </div>
    </Modal>
  );
}

type DeleteFileModalProps = {
  open: boolean;
  onClose: () => void;
  fileName: string;
  isPending: boolean;
  onConfirm: () => void;
};

function DeleteFileModal({
  open,
  onClose,
  fileName,
  isPending,
  onConfirm,
}: DeleteFileModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Delete File from Google Drive?">
      <p className="text-body text-text-secondary">
        Are you sure you want to delete <strong className="text-text-primary">{fileName}</strong>?
        This action will permanently remove the file from your Google Drive.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? "Deleting..." : "Delete File"}
        </Button>
      </div>
    </Modal>
  );
}

type VideoPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  file: ApiDriveFile | null;
};

function VideoPreviewModal({ open, onClose, file }: VideoPreviewModalProps) {
  if (!file) return null;

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={file.name}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-4xl overflow-hidden rounded-modal border border-border bg-bg-elevated shadow-card"
          >
            <div className="flex items-center justify-between gap-4 border-b border-border/50 px-6 py-4">
              <h2 className="truncate font-heading text-card-title text-text-primary">
                {file.name}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-button p-2 text-text-secondary transition-colors duration-hover hover:text-text-primary"
              >
                <Icon icon={X} size={18} />
              </button>
            </div>
            <div className="relative w-full bg-black">
              <iframe
                src={`https://drive.google.com/file/d/${file.id}/preview`}
                className="h-[500px] w-full"
                allow="autoplay; encrypted-media"
                title={file.name}
              />
            </div>
            <div className="flex items-center justify-between border-t border-border/50 px-6 py-3">
              <span className="text-caption text-text-muted">{file.name}</span>
              {file.webViewLink ? (
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-button text-text-secondary transition-colors duration-hover hover:text-primary"
                >
                  <span className="text-helper font-medium">Open in Drive</span>
                  <Icon icon={ExternalLink} size={12} />
                </a>
              ) : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export default function ProjectDetailPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { retry, cancel } = useJobActions();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteFileOpen, setDeleteFileOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ApiDriveFile | null>(null);
  const [previewFile, setPreviewFile] = useState<ApiDriveFile | null>(null);

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

  const driveFilesQuery = useQuery({
    queryKey: ["project-drive-files", id],
    queryFn: () => api<ApiDriveFile[]>(`/projects/${id}/drive-files`),
    enabled: !!id,
  });

  const submitBatch = useMutation({
    mutationFn: async (links: BatchCreateLink[]) => {
      const validation = await api<ApiValidateResult[]>("/links/validate", {
        method: "POST",
        body: { urls: links.map((link) => link.url) },
      });
      const invalid = validation.filter((result) => "error" in result);
      if (invalid.length > 0) {
        throw new Error(`Invalid URL: ${invalid.map((r) => r.url).join(", ")}`);
      }
      return api<BatchCreateResponse>(`/projects/${id}/jobs`, {
        method: "POST",
        body: { links },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["project-drive-files", id] });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      useToastStore
        .getState()
        .push(`${data.jobs.length} links added to queue`);
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
      useToastStore.getState().push("Project renamed successfully");
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
      useToastStore.getState().push("Project deleted");
      router.push("/projects");
    },
    onError: (error: Error) =>
      useToastStore.getState().push(error.message, "error"),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) =>
      api<void>(`/projects/${id}/drive-files/${fileId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-drive-files", id] });
      useToastStore.getState().push("File deleted from Google Drive");
      setDeleteFileOpen(false);
      setFileToDelete(null);
    },
    onError: (error: Error) =>
      useToastStore.getState().push(error.message, "error"),
  });

  const queries = [projectQuery, jobsQuery];

  if (queries.some((q) => q.isPending)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg-base">
        <Spinner size="lg" />
        <p className="text-body text-text-secondary">Loading project...</p>
      </div>
    );
  }

  if (queries.some((q) => q.isError)) {
    const error = queries.find((q) => q.isError)?.error;
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg-base p-6">
        <div className="w-full max-w-md rounded-card border border-status-danger bg-bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Icon icon={AlertCircle} size={18} className="text-status-danger" />
            <h2 className="font-heading text-card-title text-text-primary">
              Failed to load project
            </h2>
          </div>
          <p className="mt-2 text-body text-text-secondary">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Button
            className="mt-4"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["project", id],
              })
            }
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const user = getUser<ApiUser>();
  const userName = user?.name || "User";

  const project = projectQuery.data!;
  const jobsData = jobsQuery.data?.data ?? [];
  const jobs = jobsData.map(mapJobToJob);
  const driveFiles = driveFilesQuery.data ?? [];

  const activeJobs = jobs.filter(
    (j) => j.status === "pending" || j.status === "processing",
  );

  return (
    <>
      <ProjectDetailTemplate
        userName={userName}
        userAvatar={user?.avatar_url ?? undefined}
        projectName={project.name}
        driveFolderUrl={project.drive_folder_url}
        activeJobs={activeJobs}
        driveFiles={driveFiles}
        onRetryJob={(job) => retry(job.id)}
        onCancelJob={(job) => cancel(job.id)}
        onSubmitLinks={(urls) => submitBatch.mutate(urls)}
        onRenameProject={() => setRenameOpen(true)}
        onDeleteProject={() => setDeleteOpen(true)}
        onRefreshDriveFiles={() => driveFilesQuery.refetch()}
        onDeleteFile={(file) => {
          setFileToDelete(file);
          setDeleteFileOpen(true);
        }}
        onPreviewFile={(file) => setPreviewFile(file)}
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
      <DeleteFileModal
        open={deleteFileOpen}
        onClose={() => {
          setDeleteFileOpen(false);
          setFileToDelete(null);
        }}
        fileName={fileToDelete?.name ?? ""}
        isPending={deleteFileMutation.isPending}
        onConfirm={() => {
          if (fileToDelete) deleteFileMutation.mutate(fileToDelete.id);
        }}
      />
      <VideoPreviewModal
        open={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </>
  );
}
