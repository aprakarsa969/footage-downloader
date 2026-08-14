import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type IconProps = {
  icon: LucideIcon;
  size?: number;
  className?: string;
};

export function Icon({ icon: IconComponent, size = 18, className }: IconProps) {
  return <IconComponent size={size} strokeWidth={2} className={cn("text-current", className)} aria-hidden="true" />;
}
