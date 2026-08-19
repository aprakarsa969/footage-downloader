import { z } from 'zod';

export const validateLinksSchema = z.object({
  urls: z
    .array(z.string().trim().min(1, 'url cannot be empty'))
    .min(1, 'urls must be a non-empty array')
    .max(20, 'urls cannot exceed 20 items'),
});
