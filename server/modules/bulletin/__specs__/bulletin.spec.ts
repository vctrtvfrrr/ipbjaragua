import { describe, expect, test } from 'vitest';
import * as z from 'zod';
import { parseSections } from '../bulletin';

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

describe('parseSections', () => {
  test('parses a single known section', async () => {
    const body = '## Estudo\n\nConteúdo do estudo.';
    const sections = await parseSections(body);
    expect(sections.article).toContain('Conteúdo do estudo.');
    expect(sections.liturgy).toBeUndefined();
  });

  test('parses multiple known sections', async () => {
    const body = '## Estudo\n\nTexto do estudo.\n\n## Liturgia do Culto\n\nTexto da liturgia.';
    const sections = await parseSections(body);
    expect(sections.article).toContain('Texto do estudo.');
    expect(sections.liturgy).toContain('Texto da liturgia.');
  });

  test('returns empty object when no known sections are present', async () => {
    const body = '## Seção Desconhecida\n\nConteúdo ignorado.';
    const sections = await parseSections(body);
    expect(Object.keys(sections)).toHaveLength(0);
  });

  test('ignores unrecognized headings between known sections', async () => {
    const body = '## Estudo\n\nTexto A.\n\n## Seção Ignorada\n\nTexto B.\n\n## Avisos\n\nTexto C.';
    const sections = await parseSections(body);
    expect(sections.article).toContain('Texto A.');
    expect(sections.announcements).toContain('Texto C.');
    expect(Object.keys(sections)).toHaveLength(2);
  });

  test('discards content before the first recognized heading', async () => {
    const body = '# Título do Boletim\n\nConteúdo antes.\n\n## Avisos\n\nTexto dos avisos.';
    const sections = await parseSections(body);
    expect(sections.announcements).toContain('Texto dos avisos.');
    expect(sections.announcements).not.toContain('Conteúdo antes.');
  });

  test('does not include the heading line in rendered HTML', async () => {
    const body = '## Estudo\n\nParágrafo do estudo.';
    const sections = await parseSections(body);
    expect(sections.article).not.toContain('<h2>');
    expect(sections.article).not.toContain('Estudo');
  });

  test('returns undefined for absent sections', async () => {
    const body = '## Estudo\n\nTexto.';
    const sections = await parseSections(body);
    expect(sections.weekly_agenda).toBeUndefined();
    expect(sections.announcements).toBeUndefined();
    expect(sections.birthdays).toBeUndefined();
    expect(sections.liturgy).toBeUndefined();
  });

  test('renders section body as HTML', async () => {
    const body = '## Avisos\n\n**Aviso importante**';
    const sections = await parseSections(body);
    expect(sections.announcements).toContain('<strong>Aviso importante</strong>');
  });

  test('promotes headings by one level in article section', async () => {
    const body = '## Estudo\n\n### Subtítulo\n\n#### Sub-subtítulo';
    const sections = await parseSections(body);
    expect(sections.article).toContain('<h2>');
    expect(sections.article).toContain('<h3>');
    expect(sections.article).not.toContain('<h3>Subtítulo</h3>');
    expect(sections.article).not.toContain('<h4>');
  });

  test('strips trailing --- delimiter from section body', async () => {
    const body = '## Avisos\n\nTexto dos avisos.\n\n---\n\n## Aniversariantes\n\nNomes.';
    const sections = await parseSections(body);
    expect(sections.announcements).not.toContain('<hr>');
    expect(sections.announcements).toContain('Texto dos avisos.');
    expect(sections.birthdays).toContain('Nomes.');
  });

  test('does not promote headings in other sections', async () => {
    const body = '## Liturgia do Culto\n\n### Adoração';
    const sections = await parseSections(body);
    expect(sections.liturgy).toContain('<h3>');
    expect(sections.liturgy).not.toContain('<h2>Adoração</h2>');
  });
});
