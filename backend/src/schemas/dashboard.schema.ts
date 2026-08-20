import { z } from 'zod';

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  project_id: z.string().optional(),
  status: z
    .enum(['pending', 'processing', 'done', 'failed', 'cancelled'])
    .optional(),
  platform: z.string().optional(),
  q: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
