import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-bg-surface border border-border text-text-secondary",
        success: "bg-status-success/10 text-status-success",
        warning: "bg-status-warning/10 text-status-warning",
        danger: "bg-status-danger/10 text-status-danger",
        info: "bg-status-info/10 text-status-info",
      },
      size: {
        default: "px-3 py-1 text-caption",
        sm: "px-2 py-0.5 text-helper",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ variant, size, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
