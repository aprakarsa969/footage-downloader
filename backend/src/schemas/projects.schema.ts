import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  drive_account_id: z.string().min(1, 'drive_account_id is required'),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
});

export const projectParamsSchema = z.object({
  id: z.string().min(1, 'project id is required'),
});
