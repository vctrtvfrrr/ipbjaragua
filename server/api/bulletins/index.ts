import { defineEventHandler } from 'h3';
import { Bulletin } from '../../modules/bulletin';

export default defineEventHandler(() => {
  return Bulletin.listDates();
});
