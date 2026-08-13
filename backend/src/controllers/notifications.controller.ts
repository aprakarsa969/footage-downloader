// Controller Notifications: list + tandai baca. Service dihapus — hanya pass-through
// (cek kepemilikan + mapping response), jadi controller langsung panggil repo.
import type { Request, Response } from 'express';
import {
  findNotificationById,
  listNotifications as listNotificationsByUser,
  markAllNotificationsRead,
  markNotificationRead,
} from '../repositories/notification.repository.js';
import { AppError } from '../utils/AppError.js';
import { notificationToResponse } from '../utils/responses.js';

/** List notifikasi user; ?unread_only=true → hanya belum dibaca. */
export async function listNotifications(req: Request, res: Response) {
  const unreadOnly = req.query.unread_only === 'true';
  const items = await listNotificationsByUser(req.user!.id, unreadOnly);
  res.json(items.map(notificationToResponse));
}

/** Tandai satu notifikasi baca. 404 kalau bukan milik user. */
export async function markRead(req: Request, res: Response) {
  const userId = req.user!.id;
  const notification = await findNotificationById(String(req.params.id));
  if (!notification || notification.userId !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Notification not found');
  }
  res.json(notificationToResponse(await markNotificationRead(notification.id, userId)));
}

/** Tandai semua notifikasi belum-baca user sebagai baca. */
export async function markAllRead(req: Request, res: Response) {
  await markAllNotificationsRead(req.user!.id);
  res.json({ ok: true });
}
