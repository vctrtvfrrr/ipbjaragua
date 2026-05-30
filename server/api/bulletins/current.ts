import { defineEventHandler } from 'h3';
import { useDb } from '../../db/client';
import { Bulletin } from '../../modules/bulletin';

export default defineEventHandler(() => {
  const today = new Date().toISOString().slice(0, 10);
  return { date: Bulletin.getCurrentDate(useDb(), today) };
});
