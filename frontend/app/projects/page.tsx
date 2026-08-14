"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FolderOpen, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import { EmptyState } from "@/components/molecules/EmptyState";
import { CreateProjectModal } from "@/components/organisms/CreateProjectModal";
import { Navbar } from "@/components/organisms/Navbar";
import { ProjectCard } from "@/components/organisms/ProjectCard";
import { Sidebar } from "@/components/organisms/Sidebar";
import { api, getUser } from "@/lib/api";
import { mapProjectToProject } from "@/lib/mappers";
import type { ApiProject, ApiUser, Paginated } from "@/types/api";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<Paginated<ApiProject>>("/projects?page=1&limit=20"),
  });

  if (projectsQuery.isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base">
        <Spinner size="lg" />
        <p className="text-body text-text-secondary">Memuat project...</p>
      </div>
    );
  }

  if (projectsQuery.isError) {
    const error = projectsQuery.error;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base p-6">
        <div className="w-full max-w-md rounded-card border border-status-danger bg-bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Icon icon={AlertCircle} size={18} className="text-status-danger" />
            <h2 className="font-heading text-card-title text-text-primary">
              Gagal memuat project
            </h2>
          </div>
          <p className="mt-2 text-body text-text-secondary">
            {error instanceof Error ? error.message : "Terjadi kesalahan"}
          </p>
          <Button
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["projects"] })}
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const user = getUser<ApiUser>();
  const userName = user?.name || "Pengguna";
  const projects = (projectsQuery.data?.data ?? []).map(mapProjectToProject);

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar userName={userName} userAvatar={user?.avatar_url ?? undefined} />
          <main className="w-full flex-1 space-y-6 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-heading text-page-title text-text-primary">Projects</h1>
              <Button icon={Plus} onClick={() => setCreateOpen(true)}>
                Buat Project Baru
              </Button>
            </div>
            {projects.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="Belum ada project"
                description="Mulai project pertama Anda"
                action={
                  <Button onClick={() => setCreateOpen(true)} icon={Plus}>
                    Buat Project Baru
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} {...project} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
