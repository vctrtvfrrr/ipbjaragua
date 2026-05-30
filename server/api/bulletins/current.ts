import { defineEventHandler } from 'h3';
import { useDb } from '../../db/client';
import { Bulletin } from '../../modules/bulletin';

/**
 * The current bulletin: the most recent one whose date is on or before today.
 * Computed per request (the site runs as live SSR, no staleness). Returns
 * `{ date: null }` when there is no current bulletin (e.g. only future dates).
 */
export default defineEventHandler(() => {
  const today = new Date().toISOString().slice(0, 10);
  return { date: Bulletin.getCurrentDate(useDb(), today) };
});
