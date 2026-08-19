// Unit test drive auth session (tests/unit). Token resolution + auto-refresh tanpa infra.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveDriveOAuthClient, type DriveAccountTokens, type DriveAuthSessionDeps } from '../../src/services/driveAuthSession.js';
import type { DriveOAuthClient, DriveTokenCredentials } from '../../src/lib/googleDrive.js';

const MOCK_CLIENT = { _type: 'mock_client' } as unknown as DriveOAuthClient;

const ACCOUNT: DriveAccountTokens = {
  id: 'acc-1',
  accessToken: 'enc_access',
  refreshToken: 'enc_refresh',
  tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
};

type StubOverrides = Partial<DriveAuthSessionDeps>;

function makeStub(overrides: StubOverrides = {}) {
  const calls = {
    decrypt: [] as string[],
    encrypt: [] as string[],
    getDriveOAuthClient: [] as DriveTokenCredentials[],
    refreshAccessToken: [] as unknown[],
    updateDriveAccountTokens: [] as { id: string; data: unknown }[],
  };

  const defaults: DriveAuthSessionDeps = {
    decrypt: (s: string) => {
      calls.decrypt.push(s);
      return `decrypted_${s}`;
    },
    encrypt: (s: string) => {
      calls.encrypt.push(s);
      return `encrypted_${s}`;
    },
    getDriveOAuthClient: (creds: DriveTokenCredentials) => {
      calls.getDriveOAuthClient.push(creds);
      return MOCK_CLIENT;
    },
    isTokenExpired: () => false,
    refreshAccessToken: async (client: unknown) => {
      calls.refreshAccessToken.push(client);
      return { accessToken: 'refreshed_token', tokenExpiresAt: new Date(2000) };
    },
    updateDriveAccountTokens: async (id: string, data: { accessTokenEncrypted: string; tokenExpiresAt: Date }) => {
      calls.updateDriveAccountTokens.push({ id, data });
    },
  };

  const deps = { ...defaults, ...overrides };
  return { deps, calls };
}

describe('driveAuthSession', () => {
  it('token not expired → decrypts, returns client (no refresh)', async () => {
    const { deps, calls } = makeStub();
    const client = await resolveDriveOAuthClient(ACCOUNT, deps);
    assert.equal(client, MOCK_CLIENT);
    assert.equal(calls.decrypt.length, 2);
    assert.equal(calls.refreshAccessToken.length, 0);
    assert.equal(calls.updateDriveAccountTokens.length, 0);
    assert.equal(calls.getDriveOAuthClient.length, 1);
    assert.equal(calls.getDriveOAuthClient[0].accessToken, 'decrypted_enc_access');
  });

  it('token expired → decrypts, refreshes, re-encrypts, persists, returns client', async () => {
    const expiredAccount = { ...ACCOUNT, tokenExpiresAt: new Date(0) };
    const { deps, calls } = makeStub({ isTokenExpired: () => true });
    const client = await resolveDriveOAuthClient(expiredAccount, deps);
    assert.equal(client, MOCK_CLIENT);
    assert.equal(calls.decrypt.length, 2);
    assert.equal(calls.refreshAccessToken.length, 1);
    assert.equal(calls.updateDriveAccountTokens.length, 1);
    assert.equal(calls.updateDriveAccountTokens[0].id, 'acc-1');
    assert.equal(calls.encrypt.length, 1);
    assert.equal(calls.getDriveOAuthClient.length, 2);
  });
});
