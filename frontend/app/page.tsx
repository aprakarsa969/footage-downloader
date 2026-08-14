"use client";

import { Button } from "@/components/atoms/Button";
import { goToGoogleLogin } from "@/lib/api";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base p-6 text-center">
      <h1 className="font-heading text-hero text-text-primary">
        Footage<span className="text-primary">Downloader</span>
      </h1>
      <p className="mt-4 max-w-md text-subtitle text-text-secondary">
        Unduh footage dari YouTube, TikTok, dan platform lainnya langsung ke Google Drive-mu.
      </p>
      <div className="mt-8">
        <Button onClick={goToGoogleLogin}>Continue with Google</Button>
      </div>
      <p className="mt-6 text-helper text-text-muted">Masuk untuk mulai mengelola project footage-mu.</p>
    </div>
  );
}
