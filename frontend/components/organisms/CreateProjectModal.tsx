"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { HardDrive } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Spinner } from "@/components/atoms/Spinner";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Modal } from "@/components/molecules/Modal";
import { api, goToDriveConnect } from "@/lib/api";
import { useToastStore } from "@/stores/toast";
import type { ApiDriveAccount, ApiProject } from "@/types/api";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  driveAccountId: z.string().min(1, "Select a Drive account"),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const accountsQuery = useQuery({
    queryKey: ["drive-accounts"],
    queryFn: () => api<ApiDriveAccount[]>("/drive-accounts"),
  });

  const createProjectMutation = useMutation({
    mutationFn: (body: CreateProjectFormValues) =>
      api<ApiProject>("/projects", {
        method: "POST",
        body: { name: body.name, drive_account_id: body.driveAccountId },
      }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      useToastStore.getState().push(`Project "${project.name}" berhasil dibuat`);
      onClose();
      router.push(`/projects/${project.id}`);
    },
    onError: (error: Error) =>
      useToastStore.getState().push(error.message, "error"),
  });

  const accounts = accountsQuery.data ?? [];
  const defaultAccount = accounts.find((account) => account.is_default) ?? accounts[0];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", driveAccountId: defaultAccount?.id ?? "" },
  });

  return (
    <Modal open={open} onClose={onClose} title="Create New Project">
      {accountsQuery.isPending ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : accounts.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={HardDrive}
            title="No Drive account connected"
            description="Connect Google Drive first to save your downloads"
            action={
              <Button onClick={goToDriveConnect}>Connect Drive Account</Button>
            }
          />
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => createProjectMutation.mutate(values))}
        >
          <div className="space-y-1">
            <label htmlFor="project-name" className="text-caption text-text-secondary">
              Project Name
            </label>
            <Input
              id="project-name"
              placeholder="e.g. August YouTube Content"
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

          <div className="space-y-1">
            <label htmlFor="project-drive" className="text-caption text-text-secondary">
              Target Drive Account
            </label>
            <Controller
              control={control}
              name="driveAccountId"
              render={({ field }) => (
                <Select
                  id="project-drive"
                  aria-label="Target Drive Account"
                  value={field.value}
                  onChange={field.onChange}
                  error={Boolean(errors.driveAccountId)}
                  options={accounts.map((account) => ({
                    value: account.id,
                    label: `${account.google_account_email}${account.is_default ? " (default)" : ""}`,
                  }))}
                />
              )}
            />
            {errors.driveAccountId ? (
              <p className="text-helper text-status-danger">
                {errors.driveAccountId.message}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
