// Controller Projects: CRUD project + proxy stream file Drive ke frontend.
import type { Request, Response } from 'express';
import { pipeline } from 'node:stream/promises';
import { projectsService } from '../services/projects.service.js';

/** List project user, paginated. */
export async function list(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const search = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : undefined;
  res.json(await projectsService.listProjects(req.user!.id, page, limit, search));
}

/** Buat project (validated via Zod middleware). */
export async function create(req: Request, res: Response) {
  const project = await projectsService.createProject(req.user!.id, {
    name: req.body.name,
    driveAccountId: req.body.drive_account_id,
  });
  res.status(201).json(project);
}

/** Detail project + ringkasan status job. */
export async function detail(req: Request, res: Response) {
  res.json(await projectsService.getProject(req.user!.id, String(req.params.id)));
}

/** Ganti nama project (validated via Zod middleware). */
export async function update(req: Request, res: Response) {
  res.json(await projectsService.updateProject(req.user!.id, String(req.params.id), req.body.name));
}

/** Soft delete project (204). */
export async function remove(req: Request, res: Response) {
  await projectsService.deleteProject(req.user!.id, String(req.params.id));
  res.status(204).send();
}

/** List file di folder Drive project (real-time). */
export async function driveFiles(req: Request, res: Response) {
  res.json(await projectsService.getProjectDriveFiles(req.user!.id, String(req.params.id)));
}

/** Hapus file permanen dari Google Drive + bersihkan referensi di DB. */
export async function deleteDriveFile(req: Request, res: Response) {
  await projectsService.deleteProjectDriveFile(
    req.user!.id,
    String(req.params.id),
    String(req.params.fileId),
  );
  res.status(204).send();
}

/** Buat temporary public permission untuk streaming video. */
export async function shareDriveFile(req: Request, res: Response) {
  const result = await projectsService.shareFileForPreview(
    req.user!.id,
    String(req.params.id),
    String(req.params.fileId),
  );
  res.json(result);
}

/** Cabut temporary public permission dari file. */
export async function revokeDriveFile(req: Request, res: Response) {
  await projectsService.revokeFilePreview(
    req.user!.id,
    String(req.params.id),
    String(req.params.fileId),
    String(req.params.permissionId),
  );
  res.status(204).send();
}

/**
 * Proxy stream file dari Google Drive ke client.
 * Mendukung header Range untuk video seeking — client bisa minta potongan byte tertentu.
 */
export async function streamDriveFile(req: Request, res: Response) {
  const rangeHeader = req.headers.range ?? (typeof req.query.range === 'string' ? req.query.range : null);
  const { stream, headers } = await projectsService.streamProjectFile(
    req.user!.id,
    String(req.params.id),
    String(req.params.fileId),
    { rangeHeader },
  );

  if (headers['Content-Range']) {
    res.status(206);
  }
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.setHeader('Accept-Ranges', 'bytes');
  try {
    await pipeline(stream, res);
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    if (!isAbort) {
      throw err;
    }
  }
}
