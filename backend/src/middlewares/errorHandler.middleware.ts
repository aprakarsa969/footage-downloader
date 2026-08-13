// Error handler global (dipasang terakhir di app.ts).
// Express 5 otomatis menangkap error async dari controller/service dan meneruskannya ke sini.
// AppError → status + code sesuai; error lain → 500 INTERNAL_ERROR.
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
}
