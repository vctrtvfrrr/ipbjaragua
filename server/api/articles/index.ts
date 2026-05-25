import { createError, defineEventHandler, getQuery } from 'h3';
import { z } from 'zod';
import { useDb } from '../../db/client';
import { listArticles } from '../../modules/articles/articles';

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export default defineEventHandler((event) => {
  const parsed = QuerySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Parâmetros inválidos' });
  }

  const { page, limit } = parsed.data;
  return listArticles(useDb(), page, limit);
});
