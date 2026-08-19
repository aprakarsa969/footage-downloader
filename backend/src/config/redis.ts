// Koneksi Redis (ioredis) untuk BullMQ (queue + worker download job).
// Lazy-init: koneksi hanya dibuat saat pertama kali dipanggil (hindari side-effect saat import di test).
import 'dotenv/config';
import { Redis } from 'ioredis';

let _connection: Redis | null = null;

/** Lazy-init Redis connection — only connects when first called. */
export function getRedisConnection(): Redis {
  if (!_connection) {
    _connection = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
    });
  }
  return _connection;
}
