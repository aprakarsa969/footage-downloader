// Wrapper Google Drive API v3 (googleapis).
// Operasi minimum: refresh token, kuota storage, buat folder, upload file, stream file untuk proxy.
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

export type DriveFolderFile = {
  id: string;
  name: string;
  mimeType: string;
  size: string | null;
  createdTime: string;
  thumbnailLink: string | null;
  webViewLink: string | null;
};

/** List semua file (non-folder, non-trashed) di dalam folder Drive tertentu. */
export async function listFolderFiles(
  client: DriveOAuthClient,
  folderId: string,
): Promise<DriveFolderFile[]> {
  const drive = google.drive({ version: 'v3', auth: client });
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
    fields: 'files(id, name, mimeType, size, createdTime, thumbnailLink, webViewLink)',
    orderBy: 'createdTime desc',
    pageSize: 1000,
  });
  return (res.data.files ?? []).map((f) => ({
    id: f.id ?? '',
    name: f.name ?? '',
    mimeType: f.mimeType ?? '',
    size: f.size ?? null,
    createdTime: f.createdTime ?? new Date().toISOString(),
    thumbnailLink: f.thumbnailLink ?? null,
    webViewLink: f.webViewLink ?? null,
  }));
}

/** Hapus file secara permanen dari Google Drive. */
export async function deleteDriveFile(
  client: DriveOAuthClient,
  fileId: string,
): Promise<void> {
  const drive = google.drive({ version: 'v3', auth: client });
  await drive.files.delete({ fileId });
}

/**
 * Buat permission "anyone with link" reader pada file.
 * Dipakai untuk streaming video via direct URL tanpa nunggu transcoder Drive.
 */
export async function shareFilePublic(
  client: DriveOAuthClient,
  fileId: string,
): Promise<{ permissionId: string }> {
  const drive = google.drive({ version: 'v3', auth: client });
  const res = await drive.permissions.create({
    fileId,
    requestBody: { type: 'anyone', role: 'reader' },
    fields: 'id',
  });
  if (!res.data.id) {
    throw new Error('Drive API returned permission without id');
  }
  return { permissionId: res.data.id };
}

/** Hapus permission spesifik dari file (cabut akses public). */
export async function revokeFilePublic(
  client: DriveOAuthClient,
  fileId: string,
  permissionId: string,
): Promise<void> {
  const drive = google.drive({ version: 'v3', auth: client });
  await drive.permissions.delete({ fileId, permissionId });
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

/** Stream isi file dari Google Drive (untuk proxy backend → frontend). Mendukung header Range untuk seeking video. */
export async function streamFile(
  client: DriveOAuthClient,
  fileId: string,
  options?: { rangeHeader?: string | null },
): Promise<{ stream: import('node:stream').Readable; headers: Record<string, string> }> {
  const drive = google.drive({ version: 'v3', auth: client });
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    {
      responseType: 'stream',
      headers: options?.rangeHeader ? { Range: options.rangeHeader } : {},
    },
  );

  const headers: Record<string, string> = {};
  if (res.headers?.['content-type']) headers['Content-Type'] = res.headers['content-type'];
  if (res.headers?.['content-length']) headers['Content-Length'] = res.headers['content-length'];
  if (res.headers?.['content-range']) headers['Content-Range'] = res.headers['content-range'];
  if (res.headers?.['accept-ranges']) headers['Accept-Ranges'] = res.headers['accept-ranges'];

  return { stream: res.data as import('node:stream').Readable, headers };
}
