"use client";

import { Folder, Film } from "lucide-react";
import Link from "next/link";

import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import { PlatformIcon } from "@/components/molecules/PlatformIcon";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import type { useGlobalSearch } from "@/hooks/useGlobalSearch";

export type SearchDropdownProps = {
  search: ReturnType<typeof useGlobalSearch>;
  onClose: () => void;
};

export function SearchDropdown({ search, onClose }: SearchDropdownProps) {
  const {
    query,
    enabled,
    isLoading,
    hasResults,
    results,
    matchedProjects,
    matchedHistory,
  } = search;

  if (!enabled) return null;

  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[320px] max-w-lg overflow-hidden rounded-dropdown border border-border bg-bg-elevated shadow-card">
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 px-4 py-6 text-text-muted">
          <Spinner size="sm" />
          <span className="text-caption">Searching...</span>
        </div>
      )}

      {/* No results */}
      {!isLoading && !hasResults && (
        <div className="px-4 py-6 text-center">
          <p className="text-caption text-text-muted">
            No results found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {/* Results */}
      {!isLoading && hasResults && (
        <div className="max-h-[400px] overflow-y-auto py-2">
          {results.includes("projects") && (
            <div>
              <p className="px-4 pb-1 pt-2 text-helper font-medium uppercase tracking-wider text-text-muted">
                Projects
              </p>
              {matchedProjects.map((project) => (
                <Link
                  key={project.id}
                  href={project.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-hover hover:bg-bg-card"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon icon={Folder} size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body text-text-primary">
                      {project.name}
                    </p>
                    <p className="text-helper text-text-muted">
                      {project.footageCount} footage
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {results.includes("history") && (
            <div>
              <p className="px-4 pb-1 pt-2 text-helper font-medium uppercase tracking-wider text-text-muted">
                Footage
              </p>
              {matchedHistory.map((entry) => (
                <Link
                  key={entry.id}
                  href={entry.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-hover hover:bg-bg-card"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-surface">
                    <Icon icon={Film} size={16} className="text-text-muted" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body text-text-primary">
                      {entry.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={entry.platform} />
                      <StatusBadge status={entry.status} size="sm" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer hint */}
      {!isLoading && hasResults && (
        <div className="border-t border-border px-4 py-2 text-center text-helper text-text-muted">
          Press <kbd className="rounded bg-bg-surface px-1.5 py-0.5 text-text-secondary">Esc</kbd> to close
        </div>
      )}
    </div>
  );
}
