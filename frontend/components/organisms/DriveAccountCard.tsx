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
    <div className="glass-card group rounded-2xl p-6 transition-all duration-hover hover:border-primary/30">
      <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-body font-semibold text-primary transition-transform duration-hover group-hover:scale-110">
            {account.email.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-body font-medium text-text-primary">{account.email}</p>
              {account.isDefault ? <Badge variant="info" size="sm">Default</Badge> : null}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${account.isActive ? "bg-emerald-400" : "bg-text-muted"}`} />
              <p className="text-helper text-text-muted">
                {account.isActive ? "Connected" : "Disconnected"} · {formatRelativeTime(account.connectedAt)}
              </p>
            </div>
          </div>
        </div>

      <div className="mt-4">
        <StorageBar usedBytes={account.storageUsedBytes} totalBytes={account.storageTotalBytes} />
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onSetDefault}
          disabled={account.isDefault || !onSetDefault}
        >
          Set Default
        </Button>
        <Button size="sm" variant="danger" onClick={onDisconnect} disabled={!onDisconnect}>
          Disconnect
        </Button>
      </div>
    </div>
  );
}
