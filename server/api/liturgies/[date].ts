import { createError, defineEventHandler, getRouterParam } from 'h3';
import { z } from 'zod';
import { useDb } from '../../db/client';
import { getLiturgy } from '../../modules/liturgy/liturgy';

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido. Use YYYY-MM-DD');

export default defineEventHandler((event) => {
  const date = getRouterParam(event, 'date');
  if (!date) {
    throw createError({ statusCode: 400, message: 'Data obrigatória' });
  }

  const parsed = DateSchema.safeParse(date);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Formato inválido' });
  }

  const liturgy = getLiturgy(useDb(), parsed.data);
  if (!liturgy) {
    throw createError({ statusCode: 404, message: 'Liturgia não encontrada' });
  }

  return liturgy;
});
