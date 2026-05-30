import { createError, defineEventHandler, getRouterParam, type H3Event } from 'h3';
import { useDb } from '../../db/client';
import { Bulletin } from '../../modules/bulletin';

export default defineEventHandler((event: H3Event) => {
  const date = getRouterParam(event, 'date');
  if (!date) {
    throw createError({ statusCode: 400, message: 'Data obrigatória' });
  }

  const bulletin = Bulletin.getBulletin(useDb(), date);
  if (!bulletin) {
    throw createError({ statusCode: 404, message: 'Boletim não encontrado' });
  }

  return bulletin;
});
