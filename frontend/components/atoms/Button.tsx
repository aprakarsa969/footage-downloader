import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "rounded-button font-body font-medium inline-flex items-center gap-2 transition-colors duration-hover active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary hover:bg-primary-hover active:bg-primary-pressed text-bg-base",
        secondary: "bg-bg-surface border border-border hover:border-border-hover text-text-primary",
        danger: "bg-status-danger/10 text-status-danger hover:bg-status-danger/20",
        ghost: "bg-transparent hover:bg-bg-surface text-text-primary",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-caption",
        fab: "h-14 w-14 rounded-full justify-center p-0 shadow-card",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    icon?: LucideIcon;
  };

export function Button({ variant, size, icon: Icon, className, children, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {Icon ? <Icon size={18} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
