import type { H3Event } from 'h3';
import { z } from 'zod';
import { useDb } from '../../db/client';
import { listAnnouncements } from '../../modules/announcements/announcements';

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['active', 'expired', 'all']).default('active'),
});

export default defineEventHandler((event: H3Event) => {
  const parsed = QuerySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Parâmetros inválidos' });
  }

  const { page, limit, status } = parsed.data;
  return listAnnouncements(useDb(), page, limit, status);
});
