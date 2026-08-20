// Service DriveAccounts: koneksi + manajemen akun Google Drive user.
import { googleDriveOAuthClient } from '../config/googleOAuth.js';
import { encrypt } from '../lib/encryption.js';
import {
  getDriveOAuthClient,
  getStorageQuota,
} from '../lib/googleDrive.js';
import {
  clearDefaultDriveAccount,
  findUserById,
  setDefaultDriveAccount,
} from '../repositories/user.repository.js';
import {
  createDriveAccount,
  deleteDriveAccount,
  findDriveAccountByIdAndUser,
  listDriveAccountsByUser,
} from '../repositories/driveAccount.repository.js';
import { countActiveProjectsByDriveAccount } from '../repositories/project.repository.js';
import { AppError } from '../utils/AppError.js';
import { driveAccountToResponse } from '../utils/responses.js';

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file', 'email'];

/** URL consent Google Drive (scope drive.file). userId dikirim via state → di-pas kembali di callback. */
function getConnectUrl(userId: string): string {
  return googleDriveOAuthClient.generateAuthUrl({
    scope: DRIVE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: userId,
  });
}

/** Proses code OAuth callback: tukar token, simpan akun terenkripsi + kuota storage. */
async function handleConnectCallback(userId: string, code: string) {
  const { tokens } = await googleDriveOAuthClient.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new AppError(400, 'OAUTH_FAILED', 'Missing access or refresh token');
  }
  googleDriveOAuthClient.setCredentials(tokens);

  const tokenInfo = await googleDriveOAuthClient.getTokenInfo(tokens.access_token);
  const googleAccountEmail = tokenInfo.email;
  if (!googleAccountEmail) {
    throw new AppError(400, 'OAUTH_FAILED', 'Could not resolve Google account email');
  }

  const tokenExpiresAt = new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000);
  const oauthClient = getDriveOAuthClient({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiresAt,
  });
  const quota = await getStorageQuota(oauthClient);

  const account = await createDriveAccount(userId, {
    googleAccountEmail,
    accessTokenEncrypted: encrypt(tokens.access_token),
    refreshTokenEncrypted: encrypt(tokens.refresh_token),
    tokenExpiresAt,
    storageUsedBytes: quota.usedBytes,
    storageTotalBytes: quota.totalBytes,
  });

  return driveAccountToResponse(account, false);
}

/** List akun Drive aktif user + tandai yang default. */
async function listDriveAccounts(userId: string) {
  const [accounts, user] = await Promise.all([
    listDriveAccountsByUser(userId),
    findUserById(userId),
  ]);
  return accounts.map((a) => driveAccountToResponse(a, a.id === user?.defaultDriveAccountId));
}

/** Set akun Drive sebagai default user. */
async function setDefault(userId: string, id: string) {
  const account = await findDriveAccountByIdAndUser(id, userId);
  if (!account) {
    throw new AppError(404, 'NOT_FOUND', 'Drive account not found');
  }
  await setDefaultDriveAccount(userId, id);
  return { default_drive_account_id: id };
}

/**
 * Hapus koneksi akun Drive.
 * Ditolak (409) kalau masih dipakai project aktif. Setelah hapus, akun default ikut di-clear bila perlu.
 */
async function removeDriveAccount(userId: string, id: string) {
  const account = await findDriveAccountByIdAndUser(id, userId);
  if (!account) {
    throw new AppError(404, 'NOT_FOUND', 'Drive account not found');
  }
  const activeProjects = await countActiveProjectsByDriveAccount(id);
  if (activeProjects > 0) {
    throw new AppError(
      409,
      'DRIVE_ACCOUNT_IN_USE',
      'Drive account masih dipakai project aktif',
    );
  }
  await deleteDriveAccount(id);
  const user = await findUserById(userId);
  if (user?.defaultDriveAccountId === id) {
    await clearDefaultDriveAccount(userId);
  }
}

export const driveAccountsService = {
  getConnectUrl,
  handleConnectCallback,
  listDriveAccounts,
  setDefault,
  removeDriveAccount,
};
