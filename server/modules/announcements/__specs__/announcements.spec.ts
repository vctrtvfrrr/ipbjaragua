import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as schema from '../../../db/schema';
import { getAnnouncement, listAnnouncements } from '../announcements';

const testDb = drizzle(new Database(':memory:'), { schema });
migrate(testDb, { migrationsFolder: './server/db/migrations' });

const TODAY = '2026-05-26';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
  testDb.delete(schema.announcements).run();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('listAnnouncements', () => {
  test('returns empty data with zero total when no announcements exist', () => {
    const result = listAnnouncements(testDb, 1, 10, 'active');
    expect(result).toEqual({ data: [], pagination: { page: 1, limit: 10, total: 0 } });
  });

  test("status='active' (default) returns only non-expired, ordered by expires_at asc", () => {
    testDb
      .insert(schema.announcements)
      .values([
        { title: 'Hoje', expires_at: TODAY },
        { title: 'Amanhã', expires_at: '2026-05-27' },
        { title: 'Semana que vem', expires_at: '2026-06-02' },
        { title: 'Ontem', expires_at: '2026-05-25' },
      ])
      .run();

    const result = listAnnouncements(testDb, 1, 10, 'active');
    expect(result.data.map((a) => a.title)).toEqual(['Hoje', 'Amanhã', 'Semana que vem']);
    expect(result.pagination.total).toBe(3);
  });

  test("status='expired' returns only expired, ordered by expires_at desc", () => {
    testDb
      .insert(schema.announcements)
      .values([
        { title: 'Hoje', expires_at: TODAY },
        { title: 'Anteontem', expires_at: '2026-05-24' },
        { title: 'Ontem', expires_at: '2026-05-25' },
        { title: 'Semana passada', expires_at: '2026-05-19' },
      ])
      .run();

    const result = listAnnouncements(testDb, 1, 10, 'expired');
    expect(result.data.map((a) => a.title)).toEqual(['Ontem', 'Anteontem', 'Semana passada']);
    expect(result.pagination.total).toBe(3);
  });

  test("status='all' returns active and expired, ordered by expires_at desc", () => {
    testDb
      .insert(schema.announcements)
      .values([
        { title: 'Hoje', expires_at: TODAY },
        { title: 'Amanhã', expires_at: '2026-05-27' },
        { title: 'Ontem', expires_at: '2026-05-25' },
      ])
      .run();

    const result = listAnnouncements(testDb, 1, 10, 'all');
    expect(result.data.map((a) => a.title)).toEqual(['Amanhã', 'Hoje', 'Ontem']);
    expect(result.pagination.total).toBe(3);
  });

  test('never includes soft-deleted announcements in any status', () => {
    testDb
      .insert(schema.announcements)
      .values([
        { title: 'Vigente vivo', expires_at: '2026-05-27' },
        { title: 'Vigente deletado', expires_at: '2026-05-28', deleted_at: '2026-05-20' },
        { title: 'Expirado vivo', expires_at: '2026-05-20' },
        { title: 'Expirado deletado', expires_at: '2026-05-19', deleted_at: '2026-05-20' },
      ])
      .run();

    const active = listAnnouncements(testDb, 1, 10, 'active');
    expect(active.data.map((a) => a.title)).toEqual(['Vigente vivo']);
    expect(active.pagination.total).toBe(1);

    const expired = listAnnouncements(testDb, 1, 10, 'expired');
    expect(expired.data.map((a) => a.title)).toEqual(['Expirado vivo']);
    expect(expired.pagination.total).toBe(1);

    const all = listAnnouncements(testDb, 1, 10, 'all');
    expect(all.data.map((a) => a.title)).toEqual(['Vigente vivo', 'Expirado vivo']);
    expect(all.pagination.total).toBe(2);
  });

  test('paginates respecting page and limit', () => {
    testDb
      .insert(schema.announcements)
      .values([
        { title: 'A', expires_at: '2026-05-27' },
        { title: 'B', expires_at: '2026-05-28' },
        { title: 'C', expires_at: '2026-05-29' },
        { title: 'D', expires_at: '2026-05-30' },
      ])
      .run();

    const page1 = listAnnouncements(testDb, 1, 2, 'active');
    expect(page1.data.map((a) => a.title)).toEqual(['A', 'B']);
    expect(page1.pagination).toEqual({ page: 1, limit: 2, total: 4 });

    const page2 = listAnnouncements(testDb, 2, 2, 'active');
    expect(page2.data.map((a) => a.title)).toEqual(['C', 'D']);
    expect(page2.pagination).toEqual({ page: 2, limit: 2, total: 4 });
  });

  test('returns only listing fields', () => {
    testDb
      .insert(schema.announcements)
      .values({
        title: 'Foo',
        description: 'Descrição',
        url: 'https://example.com',
        expires_at: '2026-05-27',
      })
      .run();

    const result = listAnnouncements(testDb, 1, 10, 'active');
    expect(Object.keys(result.data[0])).toEqual(['id', 'title', 'description', 'url', 'expires_at']);
    expect(result.data[0]).toMatchObject({
      title: 'Foo',
      description: 'Descrição',
      url: 'https://example.com',
      expires_at: '2026-05-27',
    });
  });
});

describe('getAnnouncement', () => {
  test('returns null when no announcement exists for the id', () => {
    expect(getAnnouncement(testDb, 99999)).toBeNull();
  });

  test("returns 'deleted' for soft-deleted announcement", () => {
    const row = testDb
      .insert(schema.announcements)
      .values({ title: 'Gone', expires_at: '2026-05-27', deleted_at: '2026-05-20' })
      .returning()
      .get();

    expect(getAnnouncement(testDb, row.id)).toBe('deleted');
  });

  test('returns the announcement for an expired (non-deleted) id', () => {
    const row = testDb
      .insert(schema.announcements)
      .values({ title: 'Expirado', expires_at: '2026-05-20' })
      .returning()
      .get();

    const result = getAnnouncement(testDb, row.id);
    expect(result).toMatchObject({ title: 'Expirado', expires_at: '2026-05-20' });
  });

  test('returns the announcement with the 5 fields for an active id', () => {
    const row = testDb
      .insert(schema.announcements)
      .values({
        title: 'Vigente',
        description: 'Resumo',
        url: 'https://example.com',
        expires_at: '2026-05-27',
      })
      .returning()
      .get();

    const result = getAnnouncement(testDb, row.id);
    expect(result).toMatchObject({
      title: 'Vigente',
      description: 'Resumo',
      url: 'https://example.com',
      expires_at: '2026-05-27',
    });
    if (result === null || result === 'deleted') return;
    expect(Object.keys(result)).toEqual(['id', 'title', 'description', 'url', 'expires_at']);
  });
});
