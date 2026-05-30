import { describe, expect, it } from 'vitest';
import { articleSeo, bulletinSeo, homeSeo, liturgySeo, summarize } from '../seo';

describe('summarize', () => {
  it('strips markdown tokens and collapses whitespace', () => {
    expect(summarize('# Título\n\nGraça e **paz** a todos.')).toBe('Título Graça e paz a todos.');
  });

  it('keeps link labels and drops the url', () => {
    expect(summarize('Veja [o site](https://example.org) agora.')).toBe('Veja o site agora.');
  });

  it('truncates long text with an ellipsis', () => {
    const long = 'palavra '.repeat(40); // 280 chars
    const result = summarize(long, 50);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('homeSeo', () => {
  it('uses the church name as title with a website card', () => {
    const seo = homeSeo();
    expect(seo.title).toBe('IPB de Jaguará do Sul');
    expect(seo.description.length).toBeGreaterThan(0);
    expect(seo.ogTitle).toBe(seo.title);
    expect(seo.ogType).toBe('website');
    expect(seo.twitterCard).toBe('summary_large_image');
  });
});

describe('articleSeo', () => {
  it('uses the article title and a description derived from the content, as an article card', () => {
    const seo = articleSeo({
      title: 'Cristo, Nossa Páscoa',
      author: 'Pr. João',
      date: '2026-04-05',
      content: '# Ressurreição\n\nGraça e **paz**.',
    });
    expect(seo.title).toBe('Cristo, Nossa Páscoa');
    expect(seo.description).toBe('Ressurreição Graça e paz.');
    expect(seo.ogType).toBe('article');
    expect(seo.articleAuthor).toEqual(['Pr. João']);
    expect(seo.articlePublishedTime).toBe('2026-04-05');
  });

  it('omits the author when there is none', () => {
    const seo = articleSeo({ title: 'T', author: null, date: '2026-04-05', content: 'x' });
    expect(seo.articleAuthor).toBeUndefined();
  });
});

describe('liturgySeo', () => {
  it('builds "Liturgia — {date}" with the theme when present', () => {
    const seo = liturgySeo({ date: '2026-05-17', theme: 'Cristo, Nossa Páscoa' });
    expect(seo.title).toContain('Liturgia');
    expect(seo.title).toContain('17 de maio de 2026');
    expect(seo.title).toContain('Cristo, Nossa Páscoa');
  });

  it('omits the theme part when blank', () => {
    const seo = liturgySeo({ date: '2026-05-17', theme: '' });
    expect(seo.title).toBe('Liturgia — 17 de maio de 2026');
  });
});

describe('bulletinSeo', () => {
  it('builds "Boletim — {date}"', () => {
    const seo = bulletinSeo({ date: '2026-05-17' });
    expect(seo.title).toBe('Boletim — 17 de maio de 2026');
  });
});
