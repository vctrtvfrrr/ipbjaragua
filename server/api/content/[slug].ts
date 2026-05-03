import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createError, defineEventHandler, getRouterParam } from 'h3';
import { parseBulletin } from '../../utils/bulletins';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug obrigatório' });
  }

  const filePath = join(process.cwd(), 'content', `${slug}.md`);
  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: 'Boletim não encontrado' });
  }

  return parseBulletin(slug);
});
