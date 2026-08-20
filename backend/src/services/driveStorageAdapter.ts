// Deep Drive Storage Adapter — encapsulates Google Drive API calls behind business-intent methods.
// Token resolution delegated to driveAuthSession.ts — no duplication.
import {
  createDriveFolder as driveCreateFolder,
  uploadFile as driveUploadFile,
  listFolderFiles as driveListFolderFiles,
  deleteDriveFile as driveDeleteDriveFile,
  shareFilePublic,
  revokeFilePublic,
  streamFile as driveStreamFile,
  type DriveOAuthClient,
  type DriveTokenCredentials,
  type DriveFolderFile,
} from '../lib/googleDrive.js';
import { resolveDriveOAuthClient, type DriveAccountTokens, type DriveAuthSessionDeps } from './driveAuthSession.js';

type DriveStorageDeps = {
  resolveDriveOAuthClient: typeof resolveDriveOAuthClient;
  createDriveFolder: (client: DriveOAuthClient, name: string) => Promise<{ id: string; url: string }>;
  uploadFile: (client: DriveOAuthClient, folderId: string, filePath: string) => Promise<{ id: string; url: string }>;
  listFolderFiles: (client: DriveOAuthClient, folderId: string) => Promise<DriveFolderFile[]>;
  deleteDriveFile: (client: DriveOAuthClient, fileId: string) => Promise<void>;
  shareFilePublic: (client: DriveOAuthClient, fileId: string) => Promise<{ permissionId: string }>;
  revokeFilePublic: (client: DriveOAuthClient, fileId: string, permissionId: string) => Promise<void>;
  streamFile: (
    client: DriveOAuthClient,
    fileId: string,
    options?: { rangeHeader?: string | null },
  ) => Promise<{ stream: import('node:stream').Readable; headers: Record<string, string> }>;
};

export type DriveStorageAdapter = {
  createFolder(account: DriveAccountTokens, folderName: string): Promise<{ id: string; url: string }>;
  uploadFile(account: DriveAccountTokens, folderId: string, filePath: string): Promise<{ id: string; url: string }>;
  listFiles(account: DriveAccountTokens, folderId: string): Promise<DriveFolderFile[]>;
  deleteFile(account: DriveAccountTokens, fileId: string): Promise<void>;
  shareFile(account: DriveAccountTokens, fileId: string): Promise<{ permissionId: string }>;
  revokeFile(account: DriveAccountTokens, fileId: string, permissionId: string): Promise<void>;
  streamFile(
    account: DriveAccountTokens,
    fileId: string,
    options?: { rangeHeader?: string | null },
  ): Promise<{ stream: import('node:stream').Readable; headers: Record<string, string> }>;
};

/**
 * Deep interface: all Google Drive storage operations behind one adapter.
 * Dependencies are injectable for testing.
 */
export function createDriveStorageAdapter(deps: DriveStorageDeps): DriveStorageAdapter {
  return {
    async createFolder(account, folderName) {
      const client = await deps.resolveDriveOAuthClient(account);
      return deps.createDriveFolder(client, folderName);
    },

    async uploadFile(account, folderId, filePath) {
      const client = await deps.resolveDriveOAuthClient(account);
      return deps.uploadFile(client, folderId, filePath);
    },

    async listFiles(account, folderId) {
      const client = await deps.resolveDriveOAuthClient(account);
      return deps.listFolderFiles(client, folderId);
    },

    async deleteFile(account, fileId) {
      const client = await deps.resolveDriveOAuthClient(account);
      return deps.deleteDriveFile(client, fileId);
    },

    async shareFile(account, fileId) {
      const client = await deps.resolveDriveOAuthClient(account);
      return deps.shareFilePublic(client, fileId);
    },

    async revokeFile(account, fileId, permissionId) {
      const client = await deps.resolveDriveOAuthClient(account);
      return deps.revokeFilePublic(client, fileId, permissionId);
    },

    async streamFile(account, fileId, options) {
      const client = await deps.resolveDriveOAuthClient(account);
      return deps.streamFile(client, fileId, options);
    },
  };
}

/** Pre-built adapter using real production deps. */
export const driveStorageAdapter = createDriveStorageAdapter({
  resolveDriveOAuthClient,
  createDriveFolder: driveCreateFolder,
  uploadFile: driveUploadFile,
  listFolderFiles: driveListFolderFiles,
  deleteDriveFile: driveDeleteDriveFile,
  shareFilePublic,
  revokeFilePublic,
  streamFile: driveStreamFile,
});
