import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { getQuery, type H3Event } from 'h3';
import { describe, expect, it } from 'vitest';
import type { ArticleListItem, ArticleListResponse } from '~~/shared/article';
import IndexPage from '../index.vue';

function item(n: number, over: Partial<ArticleListItem> = {}): ArticleListItem {
  return {
    id: n,
    slug: `artigo-${n}`,
    title: `Artigo ${n}`,
    author: 'Pr. João',
    date: '2026-05-17',
    excerpt: `Resumo do artigo ${n}.`,
    ...over,
  };
}

/** Registers /api/articles returning `total` items, paginated by the requested page (10 per page). */
function registerArticles(total: number) {
  registerEndpoint('/api/articles', (event: H3Event): ArticleListResponse => {
    const limit = 10;
    const page = Number(getQuery(event).page) || 1;
    const start = (page - 1) * limit;
    const data = Array.from({ length: Math.max(0, Math.min(limit, total - start)) }, (_, i) => item(start + i + 1));
    return { data, pagination: { page, limit, total } };
  });
}

describe('pages/index (home)', () => {
  it('renders the paginated article listing with links to each article', async () => {
    registerArticles(3);

    const wrapper = await mountSuspended(IndexPage, { route: '/' });

    const links = wrapper.findAll('a[href^="/articles/"]');
    expect(links).toHaveLength(3);
    expect(links[0]?.attributes('href')).toBe('/articles/artigo-1');
    expect(wrapper.text()).toContain('Artigo 1');
  });

  it('puts title, date and author inside the link and the excerpt as plain text outside it', async () => {
    registerArticles(1);

    const wrapper = await mountSuspended(IndexPage, { route: '/' });

    const link = wrapper.get('a[href^="/articles/"]');
    expect(link.text()).toContain('Artigo 1');
    expect(link.text()).toContain('Pr. João');
    expect(link.find('time').exists()).toBe(true);
    // excerpt lives outside the clickable area
    expect(link.text()).not.toContain('Resumo do artigo 1.');
    expect(wrapper.get('li').text()).toContain('Resumo do artigo 1.');
  });

  it('renders classic ?page=N pagination links and loads the requested page', async () => {
    registerArticles(25); // 3 pages of 10

    const wrapper = await mountSuspended(IndexPage, { route: '/?page=2' });

    expect(wrapper.text()).toContain('Artigo 11'); // first item of page 2
    const pageLinks = wrapper.findAll('nav[aria-label="Paginação"] a');
    expect(pageLinks.map((a) => a.attributes('href'))).toEqual(['/?page=1', '/?page=2', '/?page=3']);
    expect(wrapper.get('nav[aria-label="Paginação"] [aria-current="page"]').text()).toBe('2');
  });

  it('shows an empty-state message when there are no articles', async () => {
    registerArticles(0);

    const wrapper = await mountSuspended(IndexPage, { route: '/' });

    expect(wrapper.text()).toContain('Nenhum artigo publicado ainda.');
    expect(wrapper.find('a[href^="/articles/"]').exists()).toBe(false);
  });

  it('renders the sidebar blocks in order Boletim → Avisos → Liturgias', async () => {
    registerArticles(1);
    registerEndpoint('/api/bulletins/current', () => ({ date: '2026-05-17' }));
    registerEndpoint('/api/announcements', () => ({
      data: [{ id: 1, title: 'Aviso', description: null, url: null, expires_at: '2026-06-01' }],
      pagination: { page: 1, limit: 10, total: 1 },
    }));

    const wrapper = await mountSuspended(IndexPage, { route: '/' });

    const blocks = wrapper.findAll('[data-sidebar-block]').map((el) => el.attributes('data-sidebar-block'));
    expect(blocks).toEqual(['bulletin', 'announcements', 'liturgies']);
  });
});
