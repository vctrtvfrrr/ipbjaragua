import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { beforeEach, describe, expect, test } from 'vitest';
import * as schema from '../../../db/schema';
import { defaultWindows, getBulletin, getCurrentDate } from '../bulletin';

const testDb = drizzle(new Database(':memory:'), { schema });
migrate(testDb, { migrationsFolder: './server/db/migrations' });

const BASE_WINDOWS = {
  agenda_from: '2026-05-18',
  agenda_to: '2026-05-24',
  birthdays_from: '2026-05-17',
  birthdays_to: '2026-05-23',
};

function insertBulletin(overrides: Partial<typeof schema.bulletins.$inferInsert> = {}) {
  return testDb
    .insert(schema.bulletins)
    .values({
      date: '2026-05-17',
      agenda_from: BASE_WINDOWS.agenda_from,
      agenda_to: BASE_WINDOWS.agenda_to,
      birthdays_from: BASE_WINDOWS.birthdays_from,
      birthdays_to: BASE_WINDOWS.birthdays_to,
      ...overrides,
    })
    .run();
}

describe('defaultWindows', () => {
  test('computes agenda window as date+1 to date+7', () => {
    const w = defaultWindows('2026-05-17');
    expect(w.agenda_from).toBe('2026-05-18');
    expect(w.agenda_to).toBe('2026-05-24');
  });

  test('computes birthdays window as date to date+6', () => {
    const w = defaultWindows('2026-05-17');
    expect(w.birthdays_from).toBe('2026-05-17');
    expect(w.birthdays_to).toBe('2026-05-23');
  });

  test('works for non-sunday dates', () => {
    const w = defaultWindows('2026-05-20');
    expect(w.agenda_from).toBe('2026-05-21');
    expect(w.agenda_to).toBe('2026-05-27');
    expect(w.birthdays_from).toBe('2026-05-20');
    expect(w.birthdays_to).toBe('2026-05-26');
  });

  test('handles month boundaries correctly', () => {
    const w = defaultWindows('2026-01-28');
    expect(w.agenda_from).toBe('2026-01-29');
    expect(w.agenda_to).toBe('2026-02-04');
    expect(w.birthdays_to).toBe('2026-02-03');
  });
});

describe('getBulletin', () => {
  beforeEach(() => {
    testDb.delete(schema.bulletins).run();
  });

  test('returns null when no bulletin exists for the given date', () => {
    expect(getBulletin(testDb, '2026-05-17')).toBeNull();
  });

  test('returns BulletinDetail with title and date', () => {
    insertBulletin({ title: 'Culto de Testemunho' });
    const result = getBulletin(testDb, '2026-05-17');
    expect(result?.title).toBe('Culto de Testemunho');
    expect(result?.date).toBe('2026-05-17');
  });

  test('returns null title when title is not set', () => {
    insertBulletin();
    const result = getBulletin(testDb, '2026-05-17');
    expect(result?.title).toBeNull();
  });

  test('all sections are null in skeleton', () => {
    insertBulletin();
    const result = getBulletin(testDb, '2026-05-17');
    expect(result?.article).toBeNull();
    expect(result?.liturgy).toBeNull();
    expect(result?.announcements).toBeNull();
    expect(result?.agenda).toBeNull();
    expect(result?.birthdays).toBeNull();
  });

  test('returns null for soft-deleted bulletin', () => {
    insertBulletin({ deleted_at: '2026-05-18T10:00:00' });
    expect(getBulletin(testDb, '2026-05-17')).toBeNull();
  });

  test('returns null for a different date', () => {
    insertBulletin({ date: '2026-05-10' });
    expect(getBulletin(testDb, '2026-05-17')).toBeNull();
  });
});

describe('getCurrentDate', () => {
  beforeEach(() => {
    testDb.delete(schema.bulletins).run();
  });

  test('returns null when no bulletins exist', () => {
    expect(getCurrentDate(testDb, '2026-05-20')).toBeNull();
  });

  test('returns the most recent bulletin date on or before today', () => {
    insertBulletin({ date: '2026-05-03' });
    insertBulletin({ date: '2026-05-17' });
    insertBulletin({ date: '2026-04-19' });
    expect(getCurrentDate(testDb, '2026-05-20')).toBe('2026-05-17');
  });

  test('ignores future-dated bulletins', () => {
    insertBulletin({ date: '2026-05-17' });
    insertBulletin({ date: '2026-05-24' });
    expect(getCurrentDate(testDb, '2026-05-20')).toBe('2026-05-17');
  });

  test('returns null when every bulletin is in the future', () => {
    insertBulletin({ date: '2026-06-01' });
    expect(getCurrentDate(testDb, '2026-05-20')).toBeNull();
  });

  test('excludes soft-deleted bulletins', () => {
    insertBulletin({ date: '2026-05-17', deleted_at: '2026-05-18T10:00:00' });
    expect(getCurrentDate(testDb, '2026-05-20')).toBeNull();
  });

  test('returns non-deleted when some are soft-deleted', () => {
    insertBulletin({ date: '2026-05-17', deleted_at: '2026-05-18T10:00:00' });
    insertBulletin({ date: '2026-05-10' });
    expect(getCurrentDate(testDb, '2026-05-20')).toBe('2026-05-10');
  });
});
