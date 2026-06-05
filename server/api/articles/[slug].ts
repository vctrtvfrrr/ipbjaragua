import type { H3Event } from 'h3';
import { z } from 'zod';
import { useDb } from '../../db/client';
import { getArticle } from '../../modules/articles/articles';

const SlugSchema = z.string().regex(/^[a-z0-9-]{1,100}$/, 'Slug inválido');

export default defineEventHandler((event: H3Event) => {
  const slug = getRouterParam(event, 'slug');
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug obrigatório' });
  }

  const parsed = SlugSchema.safeParse(slug);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Slug inválido' });
  }

  const result = getArticle(useDb(), parsed.data);
  if (result === null) {
    throw createError({ statusCode: 404, message: 'Artigo não encontrado' });
  }
  if (result === 'deleted') {
    throw createError({ statusCode: 410, message: 'Artigo removido' });
  }

  return result;
});
