import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const spinnerVariants = cva("animate-spin rounded-full border-2 border-current border-t-transparent", {
  variants: {
    size: {
      sm: "h-4 w-4",
      default: "h-5 w-5",
      lg: "h-8 w-8",
    },
  },
  defaultVariants: { size: "default" },
});

export type SpinnerProps = VariantProps<typeof spinnerVariants> & {
  className?: string;
};

export function Spinner({ size, className }: SpinnerProps) {
  return <span role="status" aria-label="Loading" className={cn("text-text-secondary", spinnerVariants({ size }), className)} />;
}
