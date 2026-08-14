import { Badge } from "@/components/atoms/Badge";
import type { BadgeProps } from "@/components/atoms/Badge";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types/job";

export type { JobStatus } from "@/types/job";

const variantByStatus: Record<JobStatus, BadgeProps["variant"]> = {
  pending: "default",
  processing: "info",
  done: "success",
  failed: "danger",
  cancelled: "default",
};

const labelByStatus: Record<JobStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  done: "Berhasil",
  failed: "Gagal",
  cancelled: "Dibatalkan",
};

export type StatusBadgeProps = {
  status: JobStatus;
  label?: string;
} & Pick<BadgeProps, "size" | "className">;

export function StatusBadge({ status, label, size, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={variantByStatus[status]}
      size={size}
      className={cn(status === "cancelled" && "bg-bg-elevated text-text-muted", className)}
    >
      {label ?? labelByStatus[status]}
    </Badge>
  );
}
