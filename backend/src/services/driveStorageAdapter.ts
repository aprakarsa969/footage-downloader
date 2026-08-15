// Deep Drive Storage Adapter — encapsulates token refresh, client instantiation, and Google Drive API calls.
// Single seam: callers specify business intent (createFolder, uploadFile, etc.), adapter handles OAuth mechanics.
// ponytail: projects.service & pipeline no longer need to know about decrypt/refresh/googleDrive primitives.
import { decrypt, encrypt } from '../lib/encryption.js';
import {
  getDriveOAuthClient,
  isTokenExpired,
  refreshAccessToken,
  createDriveFolder as driveCreateFolder,
  uploadFile as driveUploadFile,
  listFolderFiles as driveListFolderFiles,
  deleteDriveFile as driveDeleteDriveFile,
  type DriveOAuthClient,
  type DriveTokenCredentials,
  type DriveFolderFile,
} from '../lib/googleDrive.js';
import { updateDriveAccountTokens } from '../repositories/driveAccount.repository.js';

type DriveStorageAccount = {
  id: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
};

type DriveStorageDeps = {
  decrypt: (encrypted: string) => string;
  encrypt: (plain: string) => string;
  getDriveOAuthClient: (creds: DriveTokenCredentials) => DriveOAuthClient;
  isTokenExpired: (creds: DriveTokenCredentials) => boolean;
  refreshAccessToken: (client: DriveOAuthClient) => Promise<{ accessToken: string; tokenExpiresAt: Date }>;
  updateDriveAccountTokens: (id: string, data: { accessTokenEncrypted: string; tokenExpiresAt: Date }) => Promise<unknown>;
  createDriveFolder: (client: DriveOAuthClient, name: string) => Promise<{ id: string; url: string }>;
  uploadFile: (client: DriveOAuthClient, folderId: string, filePath: string) => Promise<{ id: string; url: string }>;
  listFolderFiles: (client: DriveOAuthClient, folderId: string) => Promise<DriveFolderFile[]>;
  deleteDriveFile: (client: DriveOAuthClient, fileId: string) => Promise<void>;
};

export type DriveStorageAdapter = {
  createFolder(account: DriveStorageAccount, folderName: string): Promise<{ id: string; url: string }>;
  uploadFile(account: DriveStorageAccount, folderId: string, filePath: string): Promise<{ id: string; url: string }>;
  listFiles(account: DriveStorageAccount, folderId: string): Promise<DriveFolderFile[]>;
  deleteFile(account: DriveStorageAccount, fileId: string): Promise<void>;
};

/**
 * Resolve a Drive OAuth client for an account: decrypt tokens, check expiry,
 * refresh if needed (persist new access token), then build the client.
 */
async function resolveClient(deps: DriveStorageDeps, account: DriveStorageAccount): Promise<DriveOAuthClient> {
  let creds: DriveTokenCredentials = {
    accessToken: deps.decrypt(account.accessToken),
    refreshToken: deps.decrypt(account.refreshToken),
    tokenExpiresAt: account.tokenExpiresAt,
  };
  if (deps.isTokenExpired(creds)) {
    const client = deps.getDriveOAuthClient(creds);
    const refreshed = await deps.refreshAccessToken(client);
    await deps.updateDriveAccountTokens(account.id, {
      accessTokenEncrypted: deps.encrypt(refreshed.accessToken),
      tokenExpiresAt: refreshed.tokenExpiresAt,
    });
    creds = { ...creds, ...refreshed };
  }
  return deps.getDriveOAuthClient(creds);
}

/**
 * Deep interface: all Google Drive storage operations behind one adapter.
 * Dependencies are injectable for testing.
 */
export function createDriveStorageAdapter(deps: DriveStorageDeps): DriveStorageAdapter {
  return {
    async createFolder(account, folderName) {
      const client = await resolveClient(deps, account);
      return deps.createDriveFolder(client, folderName);
    },

    async uploadFile(account, folderId, filePath) {
      const client = await resolveClient(deps, account);
      return deps.uploadFile(client, folderId, filePath);
    },

    async listFiles(account, folderId) {
      const client = await resolveClient(deps, account);
      return deps.listFolderFiles(client, folderId);
    },

    async deleteFile(account, fileId) {
      const client = await resolveClient(deps, account);
      return deps.deleteDriveFile(client, fileId);
    },
  };
}

/** Pre-built adapter using real production deps. */
export const driveStorageAdapter = createDriveStorageAdapter({
  decrypt,
  encrypt,
  getDriveOAuthClient,
  isTokenExpired,
  refreshAccessToken,
  updateDriveAccountTokens,
  createDriveFolder: driveCreateFolder,
  uploadFile: driveUploadFile,
  listFolderFiles: driveListFolderFiles,
  deleteDriveFile: driveDeleteDriveFile,
});
