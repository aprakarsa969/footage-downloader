// Service Projects: CRUD project (soft delete) + buat folder Drive saat project dibuat.
import { createDriveFolder } from '../lib/googleDrive.js';
import { getDriveClientWithRefresh } from './driveAccounts.service.js';
import { findDriveAccountByIdAndUser } from '../repositories/driveAccount.repository.js';
import {
  countProjectsByUser,
  createProject as insertProject,
  findProjectByIdAndUser,
  listProjectsByUser,
  softDeleteProject,
  updateProjectName,
} from '../repositories/project.repository.js';
import { countProjectJobsByStatus } from '../repositories/downloadJob.repository.js';
import { AppError } from '../utils/AppError.js';
import { projectToResponse } from '../utils/responses.js';

type JobStatus = 'pending' | 'processing' | 'done' | 'failed' | 'cancelled';

/** Buat project: pastikan akun Drive ada → buat folder Drive → simpan project. */
async function createProject(userId: string, body: { name: string; driveAccountId: string }) {
  const account = await findDriveAccountByIdAndUser(body.driveAccountId, userId);
  if (!account) {
    throw new AppError(404, 'NOT_FOUND', 'Drive account not found');
  }
  const client = await getDriveClientWithRefresh(account);
  const folder = await createDriveFolder(client, body.name);

  const project = await insertProject({
    userId,
    driveAccountId: body.driveAccountId,
    name: body.name,
    driveFolderId: folder.id,
    driveFolderUrl: folder.url,
  });

  return projectToResponse(project);
}

/** List project user, paginated, terbaru dulu. */
async function listProjects(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    listProjectsByUser(userId, skip, limit),
    countProjectsByUser(userId),
  ]);
  return {
    data: data.map(projectToResponse),
    total,
    page,
    limit,
  };
}

/** Detail project + ringkasan jumlah job per status. */
async function getProject(userId: string, id: string) {
  const project = await findProjectByIdAndUser(id, userId);
  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }
  const grouped = await countProjectJobsByStatus(id);
  const summary = {} as Record<JobStatus, number>;
  for (const status of ['pending', 'processing', 'done', 'failed', 'cancelled'] as const) {
    summary[status] = 0;
  }
  for (const row of grouped) {
    summary[row.status] = row._count.status;
  }
  return {
    ...projectToResponse(project),
    job_status_summary: summary,
  };
}

/** Ganti nama project (harus milik user). */
async function updateProject(userId: string, id: string, name: string) {
  const project = await findProjectByIdAndUser(id, userId);
  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }
  const updated = await updateProjectName(id, name);
  return projectToResponse(updated);
}

/** Soft delete project (folder & file Drive tidak dihapus). */
async function deleteProject(userId: string, id: string) {
  const project = await findProjectByIdAndUser(id, userId);
  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }
  await softDeleteProject(id);
}

export const projectsService = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
};
