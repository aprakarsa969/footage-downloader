"use client";

import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { StorageBar } from "@/components/molecules/StorageBar";
import { formatRelativeTime } from "@/lib/date";
import type { DriveAccount } from "@/types/drive-account";

export type DriveAccountCardProps = {
  account: DriveAccount;
  onSetDefault?: () => void;
  onDisconnect?: () => void;
};

export function DriveAccountCard({ account, onSetDefault, onDisconnect }: DriveAccountCardProps) {
  return (
    <div className="space-y-4 rounded-card border border-border bg-bg-card p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-surface text-helper font-medium text-text-secondary">
              {account.email.charAt(0).toUpperCase()}
            </span>
            <p className="truncate text-body font-medium text-text-primary">{account.email}</p>
            {account.isDefault ? <Badge variant="info" size="sm">Default</Badge> : null}
          </div>
          <p className="mt-1 text-caption text-text-muted">
            {account.isActive ? "Terhubung" : "Terputus"} · {formatRelativeTime(account.connectedAt)}
          </p>
        </div>
      </div>
      <StorageBar usedBytes={account.storageUsedBytes} totalBytes={account.storageTotalBytes} />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onSetDefault}
          disabled={account.isDefault || !onSetDefault}
        >
          Jadikan Default
        </Button>
        <Button size="sm" variant="danger" onClick={onDisconnect} disabled={!onDisconnect}>
          Putuskan Koneksi
        </Button>
      </div>
    </div>
  );
}
