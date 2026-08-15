"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, HardDrive, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import { EmptyState } from "@/components/molecules/EmptyState";
import { DriveAccountCard } from "@/components/organisms/DriveAccountCard";
import { AppShell } from "@/components/templates/AppShell";
import { api, getUser, goToDriveConnect } from "@/lib/api";
import { mapApiDriveAccountToDriveAccount } from "@/lib/mappers";
import { useToastStore } from "@/stores/toast";
import type {
  ApiDriveAccount,
  ApiUser,
  SetDefaultResponse,
} from "@/types/api";

export default function DriveAccountsPage() {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      useToastStore.getState().push("Drive account connected successfully");
    }
    const error = params.get("error");
    if (error) {
      useToastStore.getState().push(decodeURIComponent(error), "error");
    }
    if (params.get("connected") || params.get("error")) {
      window.history.replaceState(null, "", "/drive-accounts");
    }
  }, []);

  const accountsQuery = useQuery({
    queryKey: ["drive-accounts"],
    queryFn: () => api<ApiDriveAccount[]>("/drive-accounts"),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) =>
      api<SetDefaultResponse>(`/drive-accounts/${id}/set-default`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      setMutationError(null);
      queryClient.invalidateQueries({ queryKey: ["drive-accounts"] });
    },
    onError: (error: Error) => setMutationError(error.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) =>
      api<void>(`/drive-accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setMutationError(null);
      queryClient.invalidateQueries({ queryKey: ["drive-accounts"] });
    },
    onError: (error: Error) => setMutationError(error.message),
  });

  if (accountsQuery.isPending) {
    return (
      <AppShell userName="">
        <div className="flex h-full items-center justify-center gap-4">
          <Spinner size="lg" />
          <p className="text-body text-text-secondary">Loading Drive accounts...</p>
        </div>
      </AppShell>
    );
  }

  if (accountsQuery.isError) {
    const error = accountsQuery.error;
    return (
      <AppShell userName="">
        <div className="flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <Icon icon={AlertCircle} size={18} className="text-status-danger" />
              <h2 className="font-heading text-card-title text-text-primary">
                Failed to load Drive accounts
              </h2>
            </div>
            <p className="mt-2 text-body text-text-secondary">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
            <Button
              className="mt-4"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["drive-accounts"] })
              }
            >
              Try Again
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const user = getUser<ApiUser>();
  const userName = user?.name || "User";
  const accounts = (accountsQuery.data ?? []).map(
    mapApiDriveAccountToDriveAccount,
  );

  return (
    <AppShell userName={userName} userAvatar={user?.avatar_url ?? undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-page-title text-text-primary">Drive Accounts</h1>
          <p className="mt-1 text-body text-text-muted">Manage connected Google Drive storage accounts.</p>
        </div>
        <Button icon={Plus} onClick={goToDriveConnect}>
          Connect New Account
        </Button>
      </div>

      {mutationError ? (
        <div className="glass-card flex items-center gap-2 rounded-2xl px-4 py-3">
          <Icon icon={AlertCircle} size={16} className="shrink-0 text-status-danger" />
          <p className="text-caption text-text-secondary">{mutationError}</p>
        </div>
      ) : null}

      {accounts.length === 0 ? (
        <EmptyState
          icon={HardDrive}
          title="No Drive accounts connected"
          description="Connect Google Drive to store your downloaded videos"
          action={
            <Button icon={Plus} onClick={goToDriveConnect}>
              Connect New Account
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <DriveAccountCard
              key={account.id}
              account={account}
              onSetDefault={
                account.isDefault || setDefaultMutation.isPending
                  ? undefined
                  : () => setDefaultMutation.mutate(account.id)
              }
              onDisconnect={
                disconnectMutation.isPending
                  ? undefined
                  : () => disconnectMutation.mutate(account.id)
              }
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
