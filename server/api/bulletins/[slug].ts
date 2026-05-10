import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createError, defineEventHandler, getRouterParam } from 'h3';
import { Bulletin } from '../../modules/bulletin';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug obrigatório' });
  }

  const filePath = join(process.cwd(), 'content/bulletins', `${slug}.md`);
  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: 'Boletim não encontrado' });
  }

  return Bulletin.parseContent(slug);
});
