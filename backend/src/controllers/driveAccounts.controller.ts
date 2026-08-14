// Controller DriveAccounts: endpoint manajemen akun Google Drive.
import type { Request, Response } from 'express';
import { driveAccountsService } from '../services/driveAccounts.service.js';

// FRONTEND_URL = origin frontend untuk redirect setelah connect Drive.
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

/** List akun Drive milik user. */
export async function list(req: Request, res: Response) {
  const accounts = await driveAccountsService.listDriveAccounts(req.user!.id);
  res.json(accounts);
}

/** Redirect ke consent Google Drive. */
export async function connect(req: Request, res: Response) {
  res.redirect(302, driveAccountsService.getConnectUrl(req.user!.id));
}

/** Callback OAuth Drive: userId dari query state, code dari query code. Redirect balik ke frontend. */
export async function connectCallback(req: Request, res: Response) {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const userId = typeof req.query.state === 'string' ? req.query.state : '';
  if (!code || !userId) {
    res.redirect(302, `${FRONTEND_URL}/drive-accounts?error=${encodeURIComponent('Missing authorization code or state')}`);
    return;
  }
  try {
    await driveAccountsService.handleConnectCallback(userId, code);
    res.redirect(302, `${FRONTEND_URL}/drive-accounts?connected=1`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to connect Drive account';
    res.redirect(302, `${FRONTEND_URL}/drive-accounts?error=${encodeURIComponent(message)}`);
  }
}

/** Set akun sebagai default user. */
export async function setDefault(req: Request, res: Response) {
  const result = await driveAccountsService.setDefault(req.user!.id, String(req.params.id));
  res.json(result);
}

/** Putuskan koneksi akun (204). 409 kalau masih dipakai project aktif. */
export async function remove(req: Request, res: Response) {
  await driveAccountsService.removeDriveAccount(req.user!.id, String(req.params.id));
  res.status(204).send();
}
