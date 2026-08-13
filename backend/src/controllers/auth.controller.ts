// Controller Auth: redirect OAuth + proses callback + logout.
// Catatan: handler callback memakai try/catch sendiri (bukan errorHandler global)
// karena bentuk response error di sini AUTH_FAILED.
import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';

/** Redirect user ke halaman consent Google. */
export async function google(_req: Request, res: Response) {
  res.redirect(302, authService.getAuthUrl());
}

/** Callback Google OAuth: tukar code → user + JWT. */
export async function callback(req: Request, res: Response) {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!code) {
      res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Missing authorization code' } });
      return;
    }
    const result = await authService.handleCallback(code);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    res.status(500).json({ error: { code: 'AUTH_FAILED', message } });
  }
}

/** Logout (client-side; JWT stateless, cukup hapus token di client). */
export async function logout(_req: Request, res: Response) {
  res.status(204).send();
}
