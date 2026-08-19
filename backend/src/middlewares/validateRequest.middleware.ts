// Validation middleware: parse & validasi req.body/query/params pakai Zod.
// Gagal validasi → AppError(400, 'INVALID_REQUEST', message) → ditangkap errorHandler global.
// Catatan: req.query & req.params adalah getter-only di Express 5 — pakai Object.defineProperty.
import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError.js';

type ValidationTarget = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export function validate(schemas: ValidationTarget) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        Object.defineProperty(req, 'query', {
          value: parsed,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        Object.defineProperty(req, 'params', {
          value: parsed,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      next();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ZodError' && 'issues' in err) {
        const issues = (err as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
        const message = issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new AppError(400, 'INVALID_REQUEST', message);
      }
      throw err;
    }
  };
}
