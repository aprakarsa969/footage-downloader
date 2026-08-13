// Repositori Notification: akses data ke tabel `notifications`.
// Notifikasi dibuat otomatis oleh worker saat batch selesai (checkBatchCompleted).
import prisma from '../config/prisma.js';

/** Buat notifikasi in-app (dipanggil worker + bisa dari service lain). */
export function createNotification(
  userId: string,
  projectId: string | null,
  batchId: string | null,
  message: string,
) {
  return prisma.notification.create({
    data: { userId, projectId, batchId, message },
  });
}

/** List notifikasi user, terbaru dulu; unreadOnly=true → hanya yang belum dibaca. */
export function listNotifications(userId: string, unreadOnly: boolean) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: 'desc' },
  });
}

/** Cari notifikasi by id (untuk cek kepemilikan sebelum mark read). */
export function findNotificationById(id: string) {
  return prisma.notification.findUnique({ where: { id } });
}

/** Tandai satu notifikasi sebagai dibaca. */
export function markNotificationRead(id: string, userId: string) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

/** Tandai semua notifikasi belum-baca milik user sebagai dibaca. */
export function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
