"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cn } from "@/lib/utils";

export type FloatingActionButtonProps = {
  onClick?: () => void;
};

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Buat project baru"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        buttonVariants({ variant: "primary", size: "fab" }),
        "fixed bottom-6 right-6 z-40 md:hidden",
      )}
    >
      <Icon icon={Plus} size={24} />
    </motion.button>
  );
}
