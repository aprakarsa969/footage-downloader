// Unit test drive storage adapter (tests/unit). Tanpa infra: semua dependency di-inject sebagai stub.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createDriveStorageAdapter, type DriveStorageAdapter } from '../../src/services/driveStorageAdapter.js';
import type { DriveFolderFile, DriveTokenCredentials } from '../../src/lib/googleDrive.js';

type StubDeps = Parameters<typeof createDriveStorageAdapter>[0];

const ACCOUNT = {
  id: 'acc-1',
  accessToken: 'enc_access_token',
  refreshToken: 'enc_refresh_token',
  tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
};

function makeStub(overrides: Partial<StubDeps> = {}): { adapter: DriveStorageAdapter; calls: Record<string, unknown[]> } {
  const calls = {
    decrypt: [] as string[],
    encrypt: [] as string[],
    refreshAccessToken: [] as unknown[],
    updateDriveAccountTokens: [] as { id: string; data: unknown }[],
    createDriveFolder: [] as { client: unknown; name: string }[],
    uploadFile: [] as { client: unknown; folderId: string; filePath: string }[],
    listFolderFiles: [] as { client: unknown; folderId: string }[],
    deleteDriveFile: [] as { client: unknown; fileId: string }[],
  };

  const defaults: StubDeps = {
    decrypt: (s: string) => {
      calls.decrypt.push(s);
      return `decrypted_${s}`;
    },
    encrypt: (s: string) => {
      calls.encrypt.push(s);
      return `encrypted_${s}`;
    },
    getDriveOAuthClient: (creds: DriveTokenCredentials) => ({
      _type: 'mock_client',
      accessToken: creds.accessToken,
      refreshToken: creds.refreshToken,
    }) as unknown as ReturnType<StubDeps['getDriveOAuthClient']>,
    isTokenExpired: () => false,
    refreshAccessToken: async (client: unknown) => {
      calls.refreshAccessToken.push(client);
      return { accessToken: 'refreshed_token', tokenExpiresAt: new Date(2000) };
    },
    updateDriveAccountTokens: async (id: string, data: { accessTokenEncrypted: string; tokenExpiresAt: Date }) => {
      calls.updateDriveAccountTokens.push({ id, data });
    },
    createDriveFolder: async (client: unknown, name: string) => {
      calls.createDriveFolder.push({ client, name });
      return { id: 'folder-1', url: 'https://drive.google.com/folder-1' };
    },
    uploadFile: async (client: unknown, folderId: string, filePath: string) => {
      calls.uploadFile.push({ client, folderId, filePath });
      return { id: 'file-1', url: 'https://drive.google.com/file-1' };
    },
    listFolderFiles: async (client: unknown, folderId: string) => {
      calls.listFolderFiles.push({ client, folderId });
      return [
        { id: 'f1', name: 'video.mp4', mimeType: 'video/mp4', size: '1024', createdTime: '2026-01-01', thumbnailLink: null, webViewLink: 'https://drive.google.com/f1' },
      ] as DriveFolderFile[];
    },
    deleteDriveFile: async (client: unknown, fileId: string) => {
      calls.deleteDriveFile.push({ client, fileId });
    },
  };

  const deps = { ...defaults, ...overrides };
  const adapter = createDriveStorageAdapter(deps);
  return { adapter, calls };
}

describe('driveStorageAdapter', () => {
  it('createFolder: decrypts token, creates folder, returns id + url', async () => {
    const { adapter, calls } = makeStub();
    const result = await adapter.createFolder(ACCOUNT, 'My Project');
    assert.equal(result.id, 'folder-1');
    assert.equal(result.url, 'https://drive.google.com/folder-1');
    assert.equal(calls.decrypt.length, 2);
    assert.deepEqual(calls.createDriveFolder[0].name, 'My Project');
  });

  it('uploadFile: decrypts token, uploads file, returns id + url', async () => {
    const { adapter, calls } = makeStub();
    const result = await adapter.uploadFile(ACCOUNT, 'folder-1', '/tmp/out.mp4');
    assert.equal(result.id, 'file-1');
    assert.equal(result.url, 'https://drive.google.com/file-1');
    assert.equal(calls.uploadFile[0].folderId, 'folder-1');
    assert.equal(calls.uploadFile[0].filePath, '/tmp/out.mp4');
  });

  it('listFiles: decrypts token, lists files in folder', async () => {
    const { adapter, calls } = makeStub();
    const files = await adapter.listFiles(ACCOUNT, 'folder-1');
    assert.equal(files.length, 1);
    assert.equal(files[0].name, 'video.mp4');
    assert.equal(calls.listFolderFiles[0].folderId, 'folder-1');
  });

  it('deleteFile: decrypts token, deletes file', async () => {
    const { adapter, calls } = makeStub();
    await adapter.deleteFile(ACCOUNT, 'file-to-delete');
    assert.equal(calls.deleteDriveFile[0].fileId, 'file-to-delete');
  });

  it('token expired → refreshes token, persists new token, uses refreshed client', async () => {
    const expiredAccount = { ...ACCOUNT, tokenExpiresAt: new Date(0) };
    const { adapter, calls } = makeStub({ isTokenExpired: () => true });
    await adapter.createFolder(expiredAccount, 'Test');
    assert.equal(calls.refreshAccessToken.length, 1);
    assert.equal(calls.updateDriveAccountTokens.length, 1);
    assert.equal(calls.updateDriveAccountTokens[0].id, 'acc-1');
    assert.equal(calls.encrypt.length, 1);
  });

  it('token not expired → skips refresh, uses existing client', async () => {
    const { adapter, calls } = makeStub({ isTokenExpired: () => false });
    await adapter.createFolder(ACCOUNT, 'Test');
    assert.equal(calls.refreshAccessToken.length, 0);
    assert.equal(calls.updateDriveAccountTokens.length, 0);
  });
});
