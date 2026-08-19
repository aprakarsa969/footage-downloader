// Unit test drive storage adapter (tests/unit). Tanpa infra: semua dependency di-inject sebagai stub.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createDriveStorageAdapter, type DriveStorageAdapter } from '../../src/services/driveStorageAdapter.js';
import type { DriveFolderFile, DriveOAuthClient, DriveTokenCredentials } from '../../src/lib/googleDrive.js';
import type { DriveAccountTokens } from '../../src/services/driveAuthSession.js';

type StubDeps = Parameters<typeof createDriveStorageAdapter>[0];

const ACCOUNT: DriveAccountTokens = {
  id: 'acc-1',
  accessToken: 'enc_access_token',
  refreshToken: 'enc_refresh_token',
  tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
};

const MOCK_CLIENT = { _type: 'mock_client' } as unknown as DriveOAuthClient;

function makeStub(overrides: Partial<StubDeps> = {}): { adapter: DriveStorageAdapter; calls: Record<string, unknown[]> } {
  const calls = {
    resolveDriveOAuthClient: [] as DriveAccountTokens[],
    createDriveFolder: [] as { client: unknown; name: string }[],
    uploadFile: [] as { client: unknown; folderId: string; filePath: string }[],
    listFolderFiles: [] as { client: unknown; folderId: string }[],
    deleteDriveFile: [] as { client: unknown; fileId: string }[],
    shareFilePublic: [] as { client: unknown; fileId: string }[],
    revokeFilePublic: [] as { client: unknown; fileId: string; permissionId: string }[],
    streamFile: [] as { client: unknown; fileId: string }[],
  };

  const defaults: StubDeps = {
    resolveDriveOAuthClient: async (account: DriveAccountTokens) => {
      calls.resolveDriveOAuthClient.push(account);
      return MOCK_CLIENT;
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
    shareFilePublic: async (client: unknown, fileId: string) => {
      calls.shareFilePublic.push({ client, fileId });
      return { permissionId: 'perm-1' };
    },
    revokeFilePublic: async (client: unknown, fileId: string, permissionId: string) => {
      calls.revokeFilePublic.push({ client, fileId, permissionId });
    },
    streamFile: async (client: unknown, fileId: string) => {
      calls.streamFile.push({ client, fileId });
      return { stream: null, headers: {} };
    },
  };

  const deps = { ...defaults, ...overrides };
  const adapter = createDriveStorageAdapter(deps);
  return { adapter, calls };
}

describe('driveStorageAdapter', () => {
  it('createFolder: resolves client, creates folder, returns id + url', async () => {
    const { adapter, calls } = makeStub();
    const result = await adapter.createFolder(ACCOUNT, 'My Project');
    assert.equal(result.id, 'folder-1');
    assert.equal(result.url, 'https://drive.google.com/folder-1');
    assert.equal(calls.resolveDriveOAuthClient.length, 1);
    assert.equal(calls.resolveDriveOAuthClient[0].id, 'acc-1');
    assert.deepEqual(calls.createDriveFolder[0].name, 'My Project');
  });

  it('uploadFile: resolves client, uploads file, returns id + url', async () => {
    const { adapter, calls } = makeStub();
    const result = await adapter.uploadFile(ACCOUNT, 'folder-1', '/tmp/out.mp4');
    assert.equal(result.id, 'file-1');
    assert.equal(result.url, 'https://drive.google.com/file-1');
    assert.equal(calls.resolveDriveOAuthClient.length, 1);
    assert.equal(calls.uploadFile[0].folderId, 'folder-1');
    assert.equal(calls.uploadFile[0].filePath, '/tmp/out.mp4');
  });

  it('listFiles: resolves client, lists files in folder', async () => {
    const { adapter, calls } = makeStub();
    const files = await adapter.listFiles(ACCOUNT, 'folder-1');
    assert.equal(files.length, 1);
    assert.equal(files[0].name, 'video.mp4');
    assert.equal(calls.resolveDriveOAuthClient.length, 1);
    assert.equal(calls.listFolderFiles[0].folderId, 'folder-1');
  });

  it('deleteFile: resolves client, deletes file', async () => {
    const { adapter, calls } = makeStub();
    await adapter.deleteFile(ACCOUNT, 'file-to-delete');
    assert.equal(calls.resolveDriveOAuthClient.length, 1);
    assert.equal(calls.deleteDriveFile[0].fileId, 'file-to-delete');
  });

  it('shareFile: resolves client, shares file publicly', async () => {
    const { adapter, calls } = makeStub();
    const result = await adapter.shareFile(ACCOUNT, 'file-1');
    assert.equal(result.permissionId, 'perm-1');
    assert.equal(calls.shareFilePublic[0].fileId, 'file-1');
  });

  it('revokeFile: resolves client, revokes public permission', async () => {
    const { adapter, calls } = makeStub();
    await adapter.revokeFile(ACCOUNT, 'file-1', 'perm-1');
    assert.equal(calls.revokeFilePublic[0].fileId, 'file-1');
    assert.equal(calls.revokeFilePublic[0].permissionId, 'perm-1');
  });

  it('streamFile: resolves client, streams file', async () => {
    const { adapter, calls } = makeStub();
    const result = await adapter.streamFile(ACCOUNT, 'file-1', { rangeHeader: 'bytes=0-100' });
    assert.equal(calls.resolveDriveOAuthClient.length, 1);
    assert.equal(calls.streamFile[0].fileId, 'file-1');
  });
});
