"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Deep seam: provides a DOM ref and automatically handles click-outside and Escape key dismissal.
 * Encapsulates mousedown + Escape key listeners behind a single hook interface.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  onClose: () => void,
  isOpen: boolean = true,
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  return ref;
}
