import { motion } from "framer-motion";

import { MonoText } from "@/components/atoms/MonoText";
import { cn } from "@/lib/utils";

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export type StorageBarProps = {
  usedBytes: number;
  totalBytes: number;
  className?: string;
};

export function StorageBar({ usedBytes, totalBytes, className }: StorageBarProps) {
  const percent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn(
        "relative h-8 overflow-hidden rounded-full bg-bg-elevated",
        className,
      )}
    >
      <motion.div
        className="h-full rounded-full bg-primary"
        initial={false}
        animate={{ width: `${clamped}%` }}
        transition={{ ease: "easeOut", duration: 0.4 }}
      />
      <div className="absolute inset-0 flex items-center justify-end px-3">
        <MonoText className="text-[10px] text-text-secondary">
          {formatBytes(usedBytes)} / {formatBytes(totalBytes)}
        </MonoText>
      </div>
    </div>
  );
}
