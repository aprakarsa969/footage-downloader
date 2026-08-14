import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type MonoTextProps = HTMLAttributes<HTMLSpanElement>;

export function MonoText({ className, ...props }: MonoTextProps) {
  return <span className={cn(className, "font-mono")} {...props} />;
}
