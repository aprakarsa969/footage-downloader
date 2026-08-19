// Middleware auth: memverifikasi JWT dari header `Authorization: Bearer <token>`.
// Fallback (prioritas urut):
//   1. Header Authorization
//   2. Cookie `footage_token` (dipakai alur OAuth navigasi browser)
//   3. Query param `token` (untuk request lintas-origin yang tak bisa kirim header/cookie, mis. <video src>)
// JWT berisi payload `{ sub: user.id }`; jika valid, `req.user.id` terisi lalu next().
// Semua kegagalan → AppError 401 (format error konsisten ditangani errorHandler).
import 'dotenv/config';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

const JWT_SECRET = process.env.JWT_SECRET ?? '';

const TOKEN_COOKIE = 'footage_token';

function getToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }
  const rawCookie = req.headers.cookie;
  if (rawCookie) {
    const match = rawCookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${TOKEN_COOKIE}=`));
    if (match) {
      return decodeURIComponent(match.slice(TOKEN_COOKIE.length + 1));
    }
  }
  const queryToken = req.query?.token;
  if (typeof queryToken === 'string' && queryToken) {
    return queryToken;
  }
  return null;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = getToken(req);
  if (!token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing Bearer token');
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === 'object' && payload.sub) {
      req.user = { id: payload.sub };
      next();
      return;
    }
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid token');
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
}
