// Controller Auth: redirect OAuth + proses callback + logout.
// Catatan: handler callback memakai try/catch sendiri (bukan errorHandler global)
// karena bentuk response error di sini AUTH_FAILED.
import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';

/** Redirect user ke halaman consent Google. */
export async function google(_req: Request, res: Response) {
  res.redirect(302, authService.getAuthUrl());
}

// FRONTEND_URL = origin frontend untuk redirect setelah login sukses.
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

/** Callback Google OAuth: tukar code → user + JWT, redirect balik ke frontend dengan token. */
export async function callback(req: Request, res: Response) {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!code) {
      res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Missing authorization code' } });
      return;
    }
    const result = await authService.handleCallback(code);
    const params = new URLSearchParams({
      token: result.token,
      name: result.user.name,
      email: result.user.email,
      avatar: result.user.avatar_url ?? '',
    });
    res.redirect(302, `${FRONTEND_URL}/login?${params.toString()}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    res.status(500).json({ error: { code: 'AUTH_FAILED', message } });
  }
}

/** Logout (client-side; JWT stateless, cukup hapus token di client). */
export async function logout(_req: Request, res: Response) {
  res.status(204).send();
}
