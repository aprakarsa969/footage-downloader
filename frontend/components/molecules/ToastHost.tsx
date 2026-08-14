"use client";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast";

export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={() => dismiss(toast.id)}
            role="status"
            className={cn(
              "cursor-pointer rounded-card border bg-bg-elevated p-4 shadow-card",
              toast.variant === "error" ? "border-status-danger" : "border-border",
            )}
          >
            <p className="text-caption text-text-primary">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
