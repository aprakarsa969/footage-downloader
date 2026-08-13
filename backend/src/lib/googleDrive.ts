// Wrapper Google Drive API v3 (googleapis).
// Hanya operasi minimum yang dibutuhkan: refresh token, kuota storage, buat folder, upload file.
import 'dotenv/config';
import { createReadStream } from 'node:fs';
import { basename } from 'node:path';
import { google } from 'googleapis';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';

export type DriveTokenCredentials = {
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
};

/** Bangun OAuth2 client Google dari kredensial terdekripsi. */
export function getDriveOAuthClient(creds: DriveTokenCredentials) {
  const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  client.setCredentials({
    access_token: creds.accessToken,
    refresh_token: creds.refreshToken,
    expiry_date: creds.tokenExpiresAt.getTime(),
  });
  return client;
}

export type DriveOAuthClient = ReturnType<typeof getDriveOAuthClient>;

/** Tukar refresh token → access token baru + waktu kedaluwarsa. */
export async function refreshAccessToken(
  client: DriveOAuthClient,
): Promise<{ accessToken: string; tokenExpiresAt: Date }> {
  const { credentials } = await client.refreshAccessToken();
  if (!credentials.access_token || !credentials.expiry_date) {
    throw new Error('Failed to refresh access token');
  }
  return {
    accessToken: credentials.access_token,
    tokenExpiresAt: new Date(credentials.expiry_date),
  };
}

/** Ambil kuota storage akun Drive (bigint byte). */
export async function getStorageQuota(client: DriveOAuthClient): Promise<{
  usedBytes: bigint;
  totalBytes: bigint;
}> {
  const drive = google.drive({ version: 'v3', auth: client });
  const res = await drive.about.get({ fields: 'storageQuota' });
  return {
    usedBytes: BigInt(res.data.storageQuota?.usage ?? 0),
    totalBytes: BigInt(res.data.storageQuota?.limit ?? 0),
  };
}

/** True jika token kedaluwarsa atau akan kedaluwarsa dalam 60 detik. */
export function isTokenExpired(creds: DriveTokenCredentials): boolean {
  return creds.tokenExpiresAt.getTime() - Date.now() < 60 * 1000;
}

/** Buat folder baru di akar Drive user, kembalikan id + URL web. */
export async function createDriveFolder(
  client: DriveOAuthClient,
  name: string,
): Promise<{ id: string; url: string }> {
  const drive = google.drive({ version: 'v3', auth: client });
  const res = await drive.files.create({
    fields: 'id,webViewLink',
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    },
  });
  if (!res.data.id || !res.data.webViewLink) {
    throw new Error('Drive API returned folder without id or url');
  }
  return { id: res.data.id, url: res.data.webViewLink };
}

/** Upload file lokal ke folder Drive via streaming (resumable), nama = basename file. */
export async function uploadFile(
  client: DriveOAuthClient,
  folderId: string,
  filePath: string,
): Promise<{ id: string; url: string }> {
  const drive = google.drive({ version: 'v3', auth: client });
  const res = await drive.files.create({
    fields: 'id,webViewLink',
    requestBody: {
      name: basename(filePath),
      parents: [folderId],
    },
    media: {
      body: createReadStream(filePath),
    },
  });
  if (!res.data.id || !res.data.webViewLink) {
    throw new Error('Drive API returned file without id or url');
  }
  return { id: res.data.id, url: res.data.webViewLink };
}
