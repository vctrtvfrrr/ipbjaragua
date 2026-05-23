import { createError, defineEventHandler, getRouterParam } from 'h3';
import { Bulletin } from '../../modules/bulletin';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug obrigatório' });
  }

  try {
    return await Bulletin.parseContent(slug);
  } catch {
    throw createError({ statusCode: 404, message: 'Boletim não encontrado' });
  }
});
