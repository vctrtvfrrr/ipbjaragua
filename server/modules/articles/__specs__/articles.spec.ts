import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { beforeEach, describe, expect, test } from 'vitest';
import * as schema from '../../../db/schema';
import { getArticle, listArticles } from '../articles';

const testDb = drizzle(new Database(':memory:'), { schema });
migrate(testDb, { migrationsFolder: './server/db/migrations' });

describe('listArticles', () => {
  beforeEach(() => {
    testDb.delete(schema.articles).run();
  });

  test('returns empty data with zero total when no articles exist', () => {
    const result = listArticles(testDb, 1, 10);
    expect(result).toEqual({ data: [], pagination: { page: 1, limit: 10, total: 0 } });
  });

  test('returns articles ordered most recent first', () => {
    testDb
      .insert(schema.articles)
      .values([
        { slug: 'a', title: 'A', date: '2026-04-19', content: '...' },
        { slug: 'b', title: 'B', date: '2026-05-17', content: '...' },
        { slug: 'c', title: 'C', date: '2026-05-03', content: '...' },
      ])
      .run();

    const result = listArticles(testDb, 1, 10);
    expect(result.data.map((a) => a.date)).toEqual(['2026-05-17', '2026-05-03', '2026-04-19']);
    expect(result.pagination.total).toBe(3);
  });

  test('paginates correctly', () => {
    testDb
      .insert(schema.articles)
      .values([
        { slug: 'a', title: 'A', date: '2026-05-17', content: '...' },
        { slug: 'b', title: 'B', date: '2026-05-10', content: '...' },
        { slug: 'c', title: 'C', date: '2026-05-03', content: '...' },
        { slug: 'd', title: 'D', date: '2026-04-26', content: '...' },
      ])
      .run();

    const page1 = listArticles(testDb, 1, 2);
    expect(page1.data.map((a) => a.slug)).toEqual(['a', 'b']);
    expect(page1.pagination).toEqual({ page: 1, limit: 2, total: 4 });

    const page2 = listArticles(testDb, 2, 2);
    expect(page2.data.map((a) => a.slug)).toEqual(['c', 'd']);
    expect(page2.pagination).toEqual({ page: 2, limit: 2, total: 4 });
  });

  test('excludes soft-deleted articles from listing and total', () => {
    testDb
      .insert(schema.articles)
      .values([
        { slug: 'active', title: 'Active', date: '2026-05-17', content: '...' },
        { slug: 'gone', title: 'Gone', date: '2026-05-10', content: '...', deleted_at: '2026-05-15' },
      ])
      .run();

    const result = listArticles(testDb, 1, 10);
    expect(result.data.map((a) => a.slug)).toEqual(['active']);
    expect(result.pagination.total).toBe(1);
  });

  test('returns only listing fields, omitting content', () => {
    testDb
      .insert(schema.articles)
      .values({
        slug: 'foo',
        title: 'Foo',
        author: 'Pr. João',
        date: '2026-05-17',
        excerpt: 'Resumo',
        content: 'Markdown completo',
      })
      .run();

    const result = listArticles(testDb, 1, 10);
    expect(Object.keys(result.data[0])).toEqual(['id', 'slug', 'title', 'author', 'date', 'excerpt']);
    expect(result.data[0].excerpt).toBe('Resumo');
  });
});

describe('getArticle', () => {
  beforeEach(() => {
    testDb.delete(schema.articles).run();
  });

  test('returns null when no article exists for the slug', () => {
    expect(getArticle(testDb, 'nao-existe')).toBeNull();
  });

  test("returns 'deleted' for soft-deleted article", () => {
    testDb
      .insert(schema.articles)
      .values({ slug: 'gone', title: 'Gone', date: '2026-05-10', content: '...', deleted_at: '2026-05-15' })
      .run();

    expect(getArticle(testDb, 'gone')).toBe('deleted');
  });

  test('returns full article with content for a valid slug', () => {
    testDb
      .insert(schema.articles)
      .values({
        slug: 'carta-aos-irmaos',
        title: 'Carta aos Irmãos',
        author: 'Pr. João',
        date: '2026-05-17',
        content: '# Olá',
      })
      .run();

    const result = getArticle(testDb, 'carta-aos-irmaos');
    expect(result).toMatchObject({
      slug: 'carta-aos-irmaos',
      title: 'Carta aos Irmãos',
      author: 'Pr. João',
      date: '2026-05-17',
      content: '# Olá',
    });
    if (result === null || result === 'deleted') return;
    expect(Object.keys(result)).toEqual(['id', 'slug', 'title', 'author', 'date', 'content']);
  });
});
