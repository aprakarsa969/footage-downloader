"use client";

import { JobQueuePanel } from "@/components/organisms/JobQueuePanel";
import { AppShell } from "@/components/templates/AppShell";

export default function QueuePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px] space-y-6">
        <h1 className="font-heading text-page-title text-text-primary">Download Queue</h1>
        <div className="glass-card rounded-2xl p-2 transition-all duration-hover hover:border-primary/30">
          <JobQueuePanel unbounded />
        </div>
      </div>
    </AppShell>
  );
}
