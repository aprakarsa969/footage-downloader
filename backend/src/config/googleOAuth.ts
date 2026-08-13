// Konfigurasi klien OAuth2 Google.
// Ada dua klien terpisah karena redirect URI berbeda:
// - googleOAuthClient : login user (scope openid/email/profile) → callback /auth/google/callback
// - googleDriveOAuthClient : koneksi akun Google Drive (scope drive.file) → callback /drive-accounts/connect/callback
import 'dotenv/config';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:4000/auth/google/callback';

const googleOAuthClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
);

const GOOGLE_DRIVE_REDIRECT_URI =
  process.env.GOOGLE_DRIVE_REDIRECT_URI ??
  'http://localhost:4000/drive-accounts/connect/callback';

const googleDriveOAuthClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_DRIVE_REDIRECT_URI,
);

export { googleOAuthClient, googleDriveOAuthClient, GOOGLE_CLIENT_ID };
