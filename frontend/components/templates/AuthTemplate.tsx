"use client";

import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";

export type AuthTemplateProps = {
  appName?: string;
  tagline?: string;
  isLoading?: boolean;
  error?: string | null;
  onLogin?: () => void;
};

export function AuthTemplate({
  appName = "Footage Downloader",
  tagline = "Unduh footage dari platform favoritmu ke Google Drive.",
  isLoading = false,
  error = null,
  onLogin,
}: AuthTemplateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base p-6">
      <div className="w-full max-w-sm rounded-modal border border-border bg-bg-surface p-8 shadow-card">
        <h1 className="text-center font-heading text-card-title text-text-primary">{appName}</h1>
        <p className="mt-2 text-center text-caption text-text-muted">{tagline}</p>
        <div className="mt-8">
          <Button className="w-full" onClick={onLogin} disabled={isLoading || !onLogin}>
            {isLoading ? (
              <>
                <Spinner size="sm" className="text-bg-base" />
                Memproses...
              </>
            ) : (
              "Continue with Google"
            )}
          </Button>
        </div>
        {error ? <p className="mt-3 text-center text-helper text-status-danger">{error}</p> : null}
      </div>
    </div>
  );
}
