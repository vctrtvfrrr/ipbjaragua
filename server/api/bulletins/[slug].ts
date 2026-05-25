import { createError, defineEventHandler, getRouterParam } from 'h3';
import { useDb } from '../../db/client';
import { Bulletin } from '../../modules/bulletin';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug obrigatório' });
  }

  try {
    return await Bulletin.parseContent(useDb(), slug);
  } catch {
    throw createError({ statusCode: 404, message: 'Boletim não encontrado' });
  }
});
