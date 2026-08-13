// Koneksi Redis (ioredis) untuk BullMQ (queue + worker download job).
// maxRetriesPerRequest: null — wajib untuk BullMQ, Redis siap menunggu selama job diproses.
import 'dotenv/config';
import { Redis } from 'ioredis';

export const redisConnection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});
