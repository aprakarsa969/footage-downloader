// Middleware auth: memverifikasi JWT dari header `Authorization: Bearer <token>`.
// JWT berisi payload `{ sub: user.id }`; jika valid, `req.user.id` terisi lalu next().
// Semua kegagalan → AppError 401 (format error konsisten ditangani errorHandler).
import 'dotenv/config';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

const JWT_SECRET = process.env.JWT_SECRET ?? '';

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing Bearer token');
  }
  const token = header.slice('Bearer '.length);
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
