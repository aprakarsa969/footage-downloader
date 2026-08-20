// Repositori Project: akses data ke tabel `projects` (folder Drive + akumulasi footage).
import prisma from '../config/prisma.js';

type CreateProjectInput = {
  userId: string;
  driveAccountId: string;
  name: string;
  driveFolderId: string;
  driveFolderUrl: string;
};

/** Buat project baru (folder Drive sudah dibuat terlebih dahulu di service). */
export function createProject(data: CreateProjectInput) {
  return prisma.project.create({ data });
}

/** List project milik user yang belum dihapus (soft-delete via deletedAt). Sertakan 3 thumbnail terbaru. */
export function listProjectsByUser(userId: string, skip: number, take: number, search?: string) {
  return prisma.project.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
    include: {
      downloadJobs: {
        where: { status: 'done', thumbnailUrl: { not: null } },
        select: { thumbnailUrl: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  });
}

/** Jumlah project aktif user (untuk pagination). */
export function countProjectsByUser(userId: string, search?: string) {
  return prisma.project.count({
    where: {
      userId,
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    },
  });
}

/** Cari satu project milik user; null kalau bukan miliknya atau sudah dihapus. */
export function findProjectByIdAndUser(id: string, userId: string) {
  return prisma.project.findFirst({ where: { id, userId, deletedAt: null } });
}

/** Ganti nama project. */
export function updateProjectName(id: string, name: string) {
  return prisma.project.update({ where: { id }, data: { name } });
}

/** Soft delete: set deletedAt (baris tetap ada di DB, folder Drive tak disentuh). */
export function softDeleteProject(id: string) {
  return prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
}

/** Tambah 1 ke total_footage_count project — dipanggil worker saat job selesai (done). */
export function incrementProjectFootageCount(projectId: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: { totalFootageCount: { increment: 1 } },
  });
}

/** Jumlah project aktif (non-deleted) yang memakai akun Drive ini — dipakai cegah hapus kalau masih dipakai. */
export function countActiveProjectsByDriveAccount(driveAccountId: string) {
  return prisma.project.count({
    where: { driveAccountId, deletedAt: null },
  });
}

/** Total total_footage_count semua project aktif user — untuk summary dashboard. */
export function sumProjectFootageByUser(userId: string) {
  return prisma.project.aggregate({
    where: { userId, deletedAt: null },
    _sum: { totalFootageCount: true },
  });
}
