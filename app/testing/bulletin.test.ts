import { describe, expect, test } from 'vitest';
import * as z from 'zod';

const BulletinFrontmatterSchema = z.object({
  title: z.string(),
  date: z.string(),
  index: z.number(),
  year: z.number(),
});

describe('BulletinFrontmatterSchema', () => {
  test('validates valid frontmatter', () => {
    const result = BulletinFrontmatterSchema.safeParse({
      title: 'Boletim Dominical',
      date: '2026-05-03',
      index: 68,
      year: 2,
    });
    expect(result.success).toBe(true);
  });

  test('fails on missing title', () => {
    const result = BulletinFrontmatterSchema.safeParse({
      date: '2026-05-03',
      index: 68,
      year: 2,
    });
    expect(result.success).toBe(false);
  });

  test('fails on wrong type for index', () => {
    const result = BulletinFrontmatterSchema.safeParse({
      title: 'Boletim Dominical',
      date: '2026-05-03',
      index: '68',
      year: 2,
    });
    expect(result.success).toBe(false);
  });

  test('fails when all fields are missing', () => {
    const result = BulletinFrontmatterSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
