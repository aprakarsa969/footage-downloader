// Setup Socket.IO untuk realtime progress.
// - Auth: JWT dikirim via handshake.auth.token → diverifikasi → socket join room `user:<id>`.
// - Isolasi per-user: event hanya sampai ke socket yang join room user tersebut.
// - emitToUser: helper yang dipakai worker untuk kirim event ke satu user.
import 'dotenv/config';
import type { Server as HttpServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { Server, type Socket } from 'socket.io';
import CORS_ORIGINS from '../config/cors.js';

const JWT_SECRET = process.env.JWT_SECRET ?? '';

let io: Server | null = null;

/** Inisialisasi Socket.IO di atas HTTP server yang sama dengan Express. */
export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, { cors: { origin: CORS_ORIGINS } });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Missing token'));
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (typeof payload === 'object' && payload.sub) {
        socket.join(`user:${payload.sub}`);
        return next();
      }
      return next(new Error('Invalid token'));
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  console.log('[socket] Socket.IO initialized');
  return io;
}

/** Kirim event ke semua socket milik satu user (room `user:<id>`). */
export function emitToUser(userId: string, event: string, data: unknown) {
  if (!io) {
    return;
  }
  io.to(`user:${userId}`).emit(event, data);
}
