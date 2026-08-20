// Deep Project Footage Storage — encapsulates authorization, Drive API, thumbnail fallback, and DB cleanup.
// Single seam: callers specify userId + projectId, module resolves account + handles all Drive operations.
import prisma from '../config/prisma.js';
import { driveStorageAdapter } from './driveStorageAdapter.js';
import { findDriveAccountByIdAndUser } from '../repositories/driveAccount.repository.js';
import { decrementProjectFootageCount, findProjectByIdAndUser } from '../repositories/project.repository.js';
import { findThumbnailsByDriveFileIds } from '../repositories/downloadJob.repository.js';
import { AppError } from '../utils/AppError.js';
import type { DriveFolderFile } from '../lib/googleDrive.js';
import type { Readable } from 'node:stream';

type ProjectFootageStorage = {
  listFootage(userId: string, projectId: string): Promise<DriveFolderFile[]>;
  deleteFootage(userId: string, projectId: string, fileId: string): Promise<void>;
  shareFootage(userId: string, projectId: string, fileId: string): Promise<{ permissionId: string; streamUrl: string }>;
  revokeFootage(userId: string, projectId: string, fileId: string, permissionId: string): Promise<void>;
  streamFootage(
    userId: string,
    projectId: string,
    fileId: string,
    options?: { rangeHeader?: string | null },
  ): Promise<{ stream: Readable; headers: Record<string, string> }>;
};

async function resolveProjectAndAccount(userId: string, projectId: string) {
  const project = await findProjectByIdAndUser(projectId, userId);
  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }
  const account = await findDriveAccountByIdAndUser(project.driveAccountId, userId);
  if (!account) {
    throw new AppError(404, 'NOT_FOUND', 'Drive account not found');
  }
  return { project, account };
}

export function createProjectFootageStorage(): ProjectFootageStorage {
  return {
    async listFootage(userId, projectId) {
      const { project, account } = await resolveProjectAndAccount(userId, projectId);
      const files = await driveStorageAdapter.listFiles(account, project.driveFolderId);

      const driveFileIds = files.filter((f) => !f.thumbnailLink).map((f) => f.id);
      const thumbnails = await findThumbnailsByDriveFileIds(driveFileIds);
      const thumbMap = new Map(thumbnails.map((t) => [t.driveFileId, t.thumbnailUrl]));

      return files.map((f) => ({
        ...f,
        thumbnailLink: f.thumbnailLink ?? thumbMap.get(f.id) ?? null,
      }));
    },

    async deleteFootage(userId, projectId, fileId) {
      const { account } = await resolveProjectAndAccount(userId, projectId);
      await driveStorageAdapter.deleteFile(account, fileId);

      const result = await prisma.downloadJob.updateMany({
        where: { projectId, driveFileId: fileId },
        data: { driveFileId: null, driveFileUrl: null },
      });

      if (result.count > 0) {
        await decrementProjectFootageCount(projectId);
      }
    },

    async shareFootage(userId, projectId, fileId) {
      const { account } = await resolveProjectAndAccount(userId, projectId);
      const { permissionId } = await driveStorageAdapter.shareFile(account, fileId);
      const streamUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
      return { permissionId, streamUrl };
    },

    async revokeFootage(userId, projectId, fileId, permissionId) {
      const { account } = await resolveProjectAndAccount(userId, projectId);
      await driveStorageAdapter.revokeFile(account, fileId, permissionId);
    },

    async streamFootage(userId, projectId, fileId, options) {
      const { account } = await resolveProjectAndAccount(userId, projectId);
      return driveStorageAdapter.streamFile(account, fileId, options);
    },
  };
}

export const projectFootageStorage = createProjectFootageStorage();
