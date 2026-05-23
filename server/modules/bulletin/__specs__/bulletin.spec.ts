import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { beforeEach, describe, expect, test } from 'vitest';
import * as schema from '../../../db/schema';
import { _injectDb, listDates, parseContent } from '../bulletin';

const testDb = drizzle(new Database(':memory:'), { schema });
migrate(testDb, { migrationsFolder: './server/db/migrations' });
_injectDb(testDb);

describe('listDates', () => {
  beforeEach(() => {
    testDb.delete(schema.articles).run();
  });

  test('returns empty array when no articles exist', () => {
    expect(listDates()).toEqual([]);
  });

  test('returns dates ordered most recent first', () => {
    testDb
      .insert(schema.articles)
      .values([
        { title: 'B1', date: '2026-04-19', index: 1, year: 1, content: 'A' },
        { title: 'B2', date: '2026-05-17', index: 5, year: 2, content: 'B' },
        { title: 'B3', date: '2026-05-03', index: 3, year: 2, content: 'C' },
      ])
      .run();
    expect(listDates()).toEqual(['2026-05-17', '2026-05-03', '2026-04-19']);
  });
});

describe('parseContent', () => {
  beforeEach(() => {
    testDb.delete(schema.agenda).run();
    testDb.delete(schema.announcements).run();
    testDb.delete(schema.members).run();
    testDb.delete(schema.articles).run();
  });

  test('throws when no article exists for the given date', async () => {
    await expect(parseContent('2026-05-17')).rejects.toThrow();
  });

  test('returns bulletin for exact date match', async () => {
    testDb
      .insert(schema.articles)
      .values({ title: 'Boletim Dominical', date: '2026-05-17', index: 70, year: 2, content: 'Texto do estudo.' })
      .run();

    const bulletin = await parseContent('2026-05-17');
    expect(bulletin.title).toBe('Boletim Dominical');
    expect(bulletin.date).toBe('2026-05-17');
    expect(bulletin.index).toBe(70);
    expect(bulletin.year).toBe(2);
    expect(bulletin.sections.article).toContain('Texto do estudo.');
  });

  test('returns most recent article when no exact date match', async () => {
    testDb
      .insert(schema.articles)
      .values({ title: 'Antigo', date: '2026-04-19', index: 67, year: 2, content: 'Conteúdo antigo.' })
      .run();

    const bulletin = await parseContent('2026-05-17');
    expect(bulletin.date).toBe('2026-04-19');
  });

  test('renders article markdown as HTML', async () => {
    testDb
      .insert(schema.articles)
      .values({ title: 'Test', date: '2026-05-17', index: 1, year: 1, content: '**Texto em negrito**' })
      .run();

    const bulletin = await parseContent('2026-05-17');
    expect(bulletin.sections.article).toContain('<strong>Texto em negrito</strong>');
  });

  test('promotes headings by one level in article section', async () => {
    testDb
      .insert(schema.articles)
      .values({ title: 'Test', date: '2026-05-17', index: 1, year: 1, content: '### Subtítulo\n\n#### Sub-subtítulo' })
      .run();

    const bulletin = await parseContent('2026-05-17');
    expect(bulletin.sections.article).toContain('<h2>');
    expect(bulletin.sections.article).toContain('<h3>');
    expect(bulletin.sections.article).not.toContain('<h3>Subtítulo</h3>');
  });

  test('returns undefined sections when related tables are empty', async () => {
    testDb
      .insert(schema.articles)
      .values({ title: 'Test', date: '2026-05-17', index: 1, year: 1, content: 'Conteúdo.' })
      .run();

    const bulletin = await parseContent('2026-05-17');
    expect(bulletin.sections.weekly_agenda).toBeUndefined();
    expect(bulletin.sections.announcements).toBeUndefined();
    expect(bulletin.sections.birthdays).toBeUndefined();
    expect(bulletin.sections.liturgy).toBeUndefined();
  });

  test('includes weekly_agenda section when agenda rows exist', async () => {
    testDb.insert(schema.articles).values({ title: 'Test', date: '2026-05-18', index: 1, year: 1, content: 'x' }).run();
    testDb
      .insert(schema.agenda)
      .values({ title: 'Momento de Oração', weekday: 3, time: '19:30', is_recurring: true })
      .run();

    const bulletin = await parseContent('2026-05-18');
    expect(bulletin.sections.weekly_agenda).toContain('Momento de Oração');
    expect(bulletin.sections.weekly_agenda).toContain('19:30');
  });

  test('includes announcements when active announcements exist', async () => {
    testDb.insert(schema.articles).values({ title: 'Test', date: '2026-05-17', index: 1, year: 1, content: 'x' }).run();
    testDb
      .insert(schema.announcements)
      .values({
        title: 'Conferência da Fé',
        description: '29 e 30 de maio',
        created_at: '2026-05-01',
        expires_at: '2026-06-01',
      })
      .run();

    const bulletin = await parseContent('2026-05-17');
    expect(bulletin.sections.announcements).toContain('Conferência da Fé');
    expect(bulletin.sections.announcements).toContain('29 e 30 de maio');
  });
});
