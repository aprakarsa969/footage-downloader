// Repositori DriveAccount: akses data ke tabel `drive_accounts` (akun Google Drive user).
import prisma from '../config/prisma.js';

type CreateDriveAccountInput = {
  googleAccountEmail: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  tokenExpiresAt: Date;
  storageUsedBytes: bigint;
  storageTotalBytes: bigint;
};

/** Simpan akun Drive baru (token sudah terenkripsi). */
export function createDriveAccount(userId: string, data: CreateDriveAccountInput) {
  return prisma.driveAccount.create({
    data: {
      userId,
      googleAccountEmail: data.googleAccountEmail,
      accessToken: data.accessTokenEncrypted,
      refreshToken: data.refreshTokenEncrypted,
      tokenExpiresAt: data.tokenExpiresAt,
      storageUsedBytes: data.storageUsedBytes,
      storageTotalBytes: data.storageTotalBytes,
    },
  });
}

/** List akun Drive aktif milik user, terbaru dulu. */
export function listDriveAccountsByUser(userId: string) {
  return prisma.driveAccount.findMany({
    where: { userId, isActive: true },
    orderBy: { connectedAt: 'desc' },
  });
}

/** Cari akun Drive milik user (tanpa filter isActive — dipakai worker/flow lain). */
export function findDriveAccountByIdAndUser(id: string, userId: string) {
  return prisma.driveAccount.findFirst({ where: { id, userId } });
}

/** Simpan access token baru hasil refresh (token terenkripsi + expiry baru). */
export function updateDriveAccountTokens(
  id: string,
  data: { accessTokenEncrypted: string; tokenExpiresAt: Date },
) {
  return prisma.driveAccount.update({
    where: { id },
    data: {
      accessToken: data.accessTokenEncrypted,
      tokenExpiresAt: data.tokenExpiresAt,
    },
  });
}

/** Update kuota storage akun Drive (dipakai saat connect/sync). */
export function updateDriveAccountStorage(
  id: string,
  storageUsedBytes: bigint,
  storageTotalBytes: bigint,
) {
  return prisma.driveAccount.update({
    where: { id },
    data: { storageUsedBytes, storageTotalBytes },
  });
}

/** Hapus akun Drive (hanya dipanggil setelah dipastikan tak dipakai project aktif). */
export function deleteDriveAccount(id: string) {
  return prisma.driveAccount.delete({ where: { id } });
}

/** Total storage (used + total) dari semua akun Drive aktif user — untuk summary dashboard. BigInt → string di service. */
export function sumDriveStorageByUser(userId: string) {
  return prisma.driveAccount.aggregate({
    where: { userId, isActive: true },
    _sum: { storageUsedBytes: true, storageTotalBytes: true },
  });
}
