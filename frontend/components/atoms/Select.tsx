"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = {
  id?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  "aria-label"?: string;
};

export function Select({
  id,
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className,
  error,
  "aria-label": ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-input border bg-bg-surface px-3 text-body text-left transition-colors duration-hover",
          error
            ? "border-status-danger focus:border-status-danger focus:ring-2 focus:ring-status-danger/20"
            : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-border-hover",
          "focus:outline-none",
        )}
      >
        <span
          className={cn(
            "truncate",
            selected ? "text-text-primary" : "text-text-muted",
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-dropdown border border-border bg-bg-elevated p-1 shadow-card backdrop-blur-xl animate-in fade-in zoom-in-95"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange?.(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-button px-3 py-2 text-caption font-medium transition-colors duration-hover",
                  isSelected
                    ? "bg-primary/15 text-primary"
                    : "text-text-secondary hover:bg-primary/10 hover:text-text-primary",
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={14} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
