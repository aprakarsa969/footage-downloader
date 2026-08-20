// Controller Links: validasi URL sebelum download.
import type { Request, Response } from 'express';
import { validateUrls } from '../services/links.service.js';

/** Validasi array URL (validated via Zod middleware). */
export async function validate(req: Request, res: Response) {
  const results = await validateUrls(req.body.urls as string[]);
  res.json(results);
}
