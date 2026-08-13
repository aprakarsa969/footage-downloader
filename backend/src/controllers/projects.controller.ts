// Controller Projects: CRUD project.
import type { Request, Response } from 'express';
import { projectsService } from '../services/projects.service.js';
import { AppError } from '../utils/AppError.js';

/** List project user, paginated. */
export async function list(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  res.json(await projectsService.listProjects(req.user!.id, page, limit));
}

/** Buat project: validasi name + drive_account_id, else 400. 201 + folder Drive dibuat otomatis. */
export async function create(req: Request, res: Response) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const driveAccountId = typeof req.body?.drive_account_id === 'string' ? req.body.drive_account_id : '';
  if (!name || !driveAccountId) {
    throw new AppError(400, 'INVALID_REQUEST', 'name and drive_account_id are required');
  }
  const project = await projectsService.createProject(req.user!.id, { name, driveAccountId });
  res.status(201).json(project);
}

/** Detail project + ringkasan status job. */
export async function detail(req: Request, res: Response) {
  res.json(await projectsService.getProject(req.user!.id, String(req.params.id)));
}

/** Ganti nama project (name wajib, else 400). */
export async function update(req: Request, res: Response) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) {
    throw new AppError(400, 'INVALID_REQUEST', 'name is required');
  }
  res.json(await projectsService.updateProject(req.user!.id, String(req.params.id), name));
}

/** Soft delete project (204). */
export async function remove(req: Request, res: Response) {
  await projectsService.deleteProject(req.user!.id, String(req.params.id));
  res.status(204).send();
}
