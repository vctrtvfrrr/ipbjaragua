import { createError, defineEventHandler, getRouterParam, type H3Event } from 'h3';
import { z } from 'zod';
import { useDb } from '../../db/client';
import { getAnnouncement } from '../../modules/announcements/announcements';

const IdSchema = z.coerce.number().int().positive();

export default defineEventHandler((event: H3Event) => {
  const raw = getRouterParam(event, 'id');
  if (!raw) {
    throw createError({ statusCode: 400, message: 'ID obrigatório' });
  }

  const parsed = IdSchema.safeParse(raw);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'ID inválido' });
  }

  const result = getAnnouncement(useDb(), parsed.data);
  if (result === null) {
    throw createError({ statusCode: 404, message: 'Aviso não encontrado' });
  }
  if (result === 'deleted') {
    throw createError({ statusCode: 410, message: 'Aviso removido' });
  }

  return result;
});
