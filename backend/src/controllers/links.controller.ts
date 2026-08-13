// Controller Links: validasi URL sebelum download.
import type { Request, Response } from 'express';
import { validateUrls } from '../services/links.service.js';
import { AppError } from '../utils/AppError.js';

/** Validasi array URL: wajib array non-kosong berisi string, else 400. */
export async function validate(req: Request, res: Response) {
  const urls = req.body?.urls;
  if (!Array.isArray(urls) || urls.length === 0 || !urls.every((u) => typeof u === 'string')) {
    throw new AppError(400, 'INVALID_REQUEST', 'urls must be a non-empty array of strings');
  }
  const results = await validateUrls(urls as string[]);
  res.json(results);
}
