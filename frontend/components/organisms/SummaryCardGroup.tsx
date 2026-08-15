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

function StatTile({
  label,
  value,
  icon,
  borderClassName,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  borderClassName: string;
}) {
  return (
    <div className={`glass-card flex items-center gap-4 rounded-2xl border-l-[3px] p-4 ${borderClassName}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-surface">
        <Icon icon={icon} size={18} className="text-text-secondary" />
      </div>
      <div className="min-w-0">
        <span className="block text-helper text-text-muted">{label}</span>
        <MonoText className="text-card-title text-text-primary">{value}</MonoText>
      </div>
    </div>
  );
}

function RingGauge({ percent, size = 48, stroke = 4 }: { percent: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-bg-elevated"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-status-info)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <MonoText className="text-helper font-semibold text-text-primary">
          {Math.round(percent)}%
        </MonoText>
      </div>
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
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatTile
        label="Projects"
        value={summary.totalProjects.toLocaleString("en-US")}
        icon={FolderOpen}
        borderClassName="border-l-status-success"
      />
      <StatTile
        label="Total Footage"
        value={summary.totalFootage.toLocaleString("en-US")}
        icon={Clapperboard}
        borderClassName="border-l-status-info"
      />
      <StatTile
        label="Active Jobs"
        value={summary.activeJobsCount.toLocaleString("en-US")}
        icon={Activity}
        borderClassName="border-l-status-warning"
      />

      {/* Google Drive Card — Ring Gauge */}
      <div className="glass-card flex items-center justify-between gap-3 rounded-2xl border-l-[3px] border-l-primary p-4">
        <div className="min-w-0">
          <div className="mb-0.5 flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon icon={HardDrive} size={14} className="text-primary" />
            </div>
            <span className="text-helper text-text-muted">Google Drive</span>
          </div>
          <div className="mt-1.5">
            <MonoText className="text-subtitle text-text-primary">
              {formatBytes(summary.storageUsedBytes)}
            </MonoText>
            <span className="text-helper text-text-muted">
              {" "}of {formatBytes(summary.storageTotalBytes)}
            </span>
          </div>
        </div>
        <RingGauge percent={clamped} />
      </div>
    </div>
  );
}
