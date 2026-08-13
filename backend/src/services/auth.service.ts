// Service Auth: alur login Google OAuth + pembuatan JWT.
// getAuthUrl → redirect user ke consent Google; handleCallback → tukar code → user → JWT.
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { googleOAuthClient, GOOGLE_CLIENT_ID } from '../config/googleOAuth.js';
import { upsertUserByGoogleId } from '../repositories/user.repository.js';

const JWT_SECRET = process.env.JWT_SECRET ?? '';
const JWT_EXPIRES_IN = '7d';

const SCOPES = ['openid', 'email', 'profile'];

/** URL consent Google untuk login user. */
function getAuthUrl(): string {
  return googleOAuthClient.generateAuthUrl({
    scope: SCOPES,
    access_type: 'online',
    prompt: 'select_account',
  });
}

/**
 * Proses code OAuth dari callback: verifikasi id_token, upsert user, buat JWT.
 * JWT berisi `{ sub: user.id }` dan kedaluwarsa 7 hari.
 */
async function handleCallback(code: string) {
  const { tokens } = await googleOAuthClient.getToken(code);
  if (!tokens.id_token) {
    throw new Error('No id_token in OAuth response');
  }
  const ticket = await googleOAuthClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload?.email) {
    throw new Error('Invalid OAuth payload');
  }

  const user = await upsertUserByGoogleId(payload.sub, {
    email: payload.email,
    name: payload.name ?? payload.email,
    avatarUrl: payload.picture ?? null,
  });

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatarUrl,
    },
  };
}

export const authService = { getAuthUrl, handleCallback };
