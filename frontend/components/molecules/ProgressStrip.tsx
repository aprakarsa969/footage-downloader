import { motion } from "framer-motion";
import { MonoText } from "@/components/atoms/MonoText";
import { cn } from "@/lib/utils";

export type ProgressStripProps = {
  percent: number;
  decimals?: number;
  remaining?: string;
  className?: string;
};

export function ProgressStrip({ percent, decimals, remaining, className }: ProgressStripProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const label = decimals != null ? Number(clamped.toFixed(decimals)) : clamped;
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clamped}
          className="h-2 flex-1 overflow-hidden rounded-full bg-bg-elevated"
        >
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${clamped}%` }}
            transition={{ ease: "easeOut", duration: 0.4 }}
          />
        </div>
        <MonoText className="text-caption text-text-secondary">{label}%</MonoText>
      </div>
      {remaining ? (
        <MonoText className="text-caption text-text-muted">{remaining} tersisa</MonoText>
      ) : null}
    </div>
  );
}
