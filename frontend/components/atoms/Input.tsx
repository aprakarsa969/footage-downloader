import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type InputProps = ComponentProps<"input">;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-input bg-bg-surface border border-border px-4 text-body text-text-primary placeholder:text-text-muted transition-colors duration-hover focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
        className
      )}
      {...props}
    />
  );
}
