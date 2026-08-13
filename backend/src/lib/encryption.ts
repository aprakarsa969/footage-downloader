// Enkripsi token Google (access/refresh) sebelum disimpan di DB.
// Algoritma: aes-256-gcm. Kunci = sha256(ENCRYPTION_KEY) dari .env (32 byte).
// Format payload terenkripsi: `iv:tag:ciphertext` (hex) — GCM butuh tag autentikasi untuk verifikasi integritas.
import 'dotenv/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = createHash('sha256').update(process.env.ENCRYPTION_KEY ?? '').digest();

/** Enkripsi teks → `iv:tag:ciphertext` (hex). iv acak per pemanggilan. */
export function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

/** Dekripsi payload `iv:tag:ciphertext`. Gagal jika data rusak (GCM auth tag). */
export function decrypt(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Invalid encrypted payload');
  }
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}
