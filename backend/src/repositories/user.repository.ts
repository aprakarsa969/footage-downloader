// Repositori User: satu-satunya akses data ke tabel `users`.
import prisma from '../config/prisma.js';

export type UpsertUserInput = {
  email: string;
  name: string;
  avatarUrl: string | null;
};

/** Buat user baru atau update data bila googleId sudah ada (login Google berulang). */
export function upsertUserByGoogleId(googleId: string, data: UpsertUserInput) {
  return prisma.user.upsert({
    where: { googleId },
    create: { googleId, ...data },
    update: data,
  });
}

/** Cari user by id (untuk ambil defaultDriveAccountId). */
export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

/** Tandai akun Drive sebagai default di tabel user. */
export function setDefaultDriveAccount(userId: string, driveAccountId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { defaultDriveAccountId: driveAccountId },
  });
}

/** Hapus penanda akun default. */
export function clearDefaultDriveAccount(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { defaultDriveAccountId: null },
  });
}
