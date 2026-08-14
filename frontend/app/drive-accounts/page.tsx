"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, HardDrive, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Navbar } from "@/components/organisms/Navbar";
import { DriveAccountCard } from "@/components/organisms/DriveAccountCard";
import { Sidebar } from "@/components/organisms/Sidebar";
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
      useToastStore.getState().push("Akun Drive berhasil dihubungkan");
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base">
        <Spinner size="lg" />
        <p className="text-body text-text-secondary">Memuat akun drive...</p>
      </div>
    );
  }

  if (accountsQuery.isError) {
    const error = accountsQuery.error;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base p-6">
        <div className="w-full max-w-md rounded-card border border-status-danger bg-bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Icon icon={AlertCircle} size={18} className="text-status-danger" />
            <h2 className="font-heading text-card-title text-text-primary">
              Gagal memuat akun drive
            </h2>
          </div>
          <p className="mt-2 text-body text-text-secondary">
            {error instanceof Error ? error.message : "Terjadi kesalahan"}
          </p>
          <Button
            className="mt-4"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["drive-accounts"] })
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
  const accounts = (accountsQuery.data ?? []).map(
    mapApiDriveAccountToDriveAccount,
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar userName={userName} userAvatar={user?.avatar_url ?? undefined} />
        <main className="w-full flex-1 space-y-6 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-page-title text-text-primary">Akun Drive</h1>
            <Button icon={Plus} onClick={goToDriveConnect}>
              Hubungkan Akun Drive Baru
            </Button>
          </div>

          {mutationError ? (
            <div className="flex items-center gap-2 rounded-card border border-status-danger bg-bg-card px-4 py-3">
              <Icon icon={AlertCircle} size={16} className="shrink-0 text-status-danger" />
              <p className="text-caption text-text-secondary">{mutationError}</p>
            </div>
          ) : null}

          {accounts.length === 0 ? (
            <EmptyState
              icon={HardDrive}
              title="Belum ada akun Drive terhubung"
              description="Hubungkan Google Drive untuk menyimpan hasil download"
              action={
                <Button icon={Plus} onClick={goToDriveConnect}>
                  Hubungkan Akun Drive Baru
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
        </main>
      </div>
    </div>
  );
}
