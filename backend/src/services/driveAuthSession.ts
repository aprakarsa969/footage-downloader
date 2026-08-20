// Deep Drive Auth Session — encapsulates token decryption, expiry check, auto-refresh, re-encryption, and DB persistence.
// Single seam: resolveDriveOAuthClient(account) → valid DriveOAuthClient. No duplication across services.
import { decrypt, encrypt } from '../lib/encryption.js';
import {
  getDriveOAuthClient,
  isTokenExpired,
  refreshAccessToken,
  type DriveOAuthClient,
  type DriveTokenCredentials,
} from '../lib/googleDrive.js';
import { updateDriveAccountTokens } from '../repositories/driveAccount.repository.js';

export type DriveAccountTokens = {
  id: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
};

export type DriveAuthSessionDeps = {
  decrypt: (encrypted: string) => string;
  encrypt: (plain: string) => string;
  getDriveOAuthClient: (creds: DriveTokenCredentials) => DriveOAuthClient;
  isTokenExpired: (creds: DriveTokenCredentials) => boolean;
  refreshAccessToken: (client: DriveOAuthClient) => Promise<{ accessToken: string; tokenExpiresAt: Date }>;
  updateDriveAccountTokens: (id: string, data: { accessTokenEncrypted: string; tokenExpiresAt: Date }) => Promise<unknown>;
};

const defaultDeps: DriveAuthSessionDeps = {
  decrypt,
  encrypt,
  getDriveOAuthClient,
  isTokenExpired,
  refreshAccessToken,
  updateDriveAccountTokens,
};

/**
 * Deep seam: resolve a valid Drive OAuth client for an account.
 * Decrypts tokens → checks expiry → refreshes if needed → re-encrypts & persists → returns client.
 * Dependencies are injectable for unit testing.
 */
export async function resolveDriveOAuthClient(
  account: DriveAccountTokens,
  deps: DriveAuthSessionDeps = defaultDeps,
): Promise<DriveOAuthClient> {
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
