import { defineEventHandler } from 'h3';
import { useDb } from '../../db/client';
import { Bulletin } from '../../modules/bulletin';

export default defineEventHandler(() => {
  return Bulletin.listDates(useDb());
});
