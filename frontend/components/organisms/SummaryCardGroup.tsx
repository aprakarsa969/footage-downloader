import { Activity, Clapperboard, type LucideIcon, FolderOpen, HardDrive } from "lucide-react";

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

function StatCard({
  label,
  value,
  icon,
  iconClassName,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName: string;
  className?: string;
}) {
  return (
    <div className={`glass-card flex flex-col rounded-2xl p-4 ${className ?? ""}`}>
      <div
        className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full ${iconClassName}`}
      >
        <Icon icon={icon} size={18} />
      </div>
      <span className="mb-1 text-caption text-text-muted">{label}</span>
      <MonoText className="text-card-title text-text-primary">{value}</MonoText>
    </div>
  );
}

export type SummaryCardGroupProps = {
  summary: DashboardSummary;
};

export function SummaryCardGroup({ summary }: SummaryCardGroupProps) {
  const storagePercent =
    summary.storageTotalBytes > 0
      ? (summary.storageUsedBytes / summary.storageTotalBytes) * 100
      : 0;
  const clamped = Math.min(100, Math.max(0, storagePercent));
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Total Project"
          value={summary.totalProjects.toLocaleString("id-ID")}
          icon={FolderOpen}
          iconClassName="bg-status-success/15 text-status-success"
        />
        <StatCard
          label="Total Footage"
          value={summary.totalFootage.toLocaleString("id-ID")}
          icon={Clapperboard}
          iconClassName="bg-status-info/15 text-status-info"
        />
        <StatCard
          label="Job Aktif"
          value={summary.activeJobsCount.toLocaleString("id-ID")}
          icon={Activity}
          iconClassName="bg-status-warning/15 text-status-warning"
          className="col-span-2"
        />
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Icon icon={HardDrive} size={18} />
          </div>
          <h4 className="text-caption font-medium text-text-primary">Storage Drive</h4>
        </div>
        <div className="mb-2 flex items-end justify-between gap-3">
          <MonoText className="text-card-title text-text-primary">
            {clamped.toFixed(1)}%
          </MonoText>
          <MonoText className="text-helper text-text-muted">
            {formatBytes(summary.storageUsedBytes)} / {formatBytes(summary.storageTotalBytes)}
          </MonoText>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-status-info"
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    </div>
  );
}
