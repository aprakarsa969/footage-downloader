"use client";

import Link from "next/link";
import { HardDrive } from "lucide-react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { MonoText } from "@/components/atoms/MonoText";
import { formatBytes } from "@/components/molecules/StorageBar";

export type DashboardSummary = {
  totalProjects: number;
  totalFootage: number;
  activeJobsCount: number;
  storageUsedBytes: number;
  storageTotalBytes: number;
};

export type SummaryCardGroupProps = {
  summary: DashboardSummary;
};

export function SummaryCardGroup({ summary }: SummaryCardGroupProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Projects */}
      <div className="glass-card rounded-card p-4">
        <p className="text-helper text-text-muted">Projects</p>
        <MonoText className="mt-1 block text-2xl font-medium text-text-primary">
          {summary.totalProjects.toLocaleString("en-US")}
        </MonoText>
      </div>

      {/* Total Footage */}
      <div className="glass-card rounded-card p-4">
        <p className="text-helper text-text-muted">Total footage</p>
        <MonoText className="mt-1 block text-2xl font-medium text-text-primary">
          {summary.totalFootage.toLocaleString("en-US")}
        </MonoText>
      </div>

      {/* Google Drive */}
      <div className="glass-card flex items-center justify-between rounded-card p-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Icon icon={HardDrive} size={14} className="text-primary" />
            <span className="text-helper text-text-muted">Google Drive</span>
          </div>
          <p className="text-body text-text-primary">
            <MonoText className="font-medium">
              {formatBytes(summary.storageUsedBytes)}
            </MonoText>
            <span className="ml-1 text-helper text-text-muted">
              of {formatBytes(summary.storageTotalBytes)}
            </span>
          </p>
        </div>
        <Link href="/drive-accounts">
          <Button size="sm" variant="secondary">
            Manage
          </Button>
        </Link>
      </div>
    </div>
  );
}
