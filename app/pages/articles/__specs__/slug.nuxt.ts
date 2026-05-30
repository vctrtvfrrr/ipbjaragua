import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { setResponseStatus, type H3Event } from 'h3';
import { describe, expect, it } from 'vitest';
import type { ArticleDetail } from '~~/shared/article';
import ArticleDetailPage from '../[slug].vue';

function buildArticle(slug: string): ArticleDetail {
  return {
    id: 1,
    slug,
    title: 'Cristo, Nossa Páscoa',
    author: 'Pr. João',
    date: '2026-04-05',
    content: '# Ressurreição\n\nGraça e **paz**.',
  };
}

function fail(event: H3Event, status: number) {
  setResponseStatus(event, status);
  return { message: 'erro' };
}

describe('pages/articles/[slug]', () => {
  it('renders the article title, author, date and rendered content', async () => {
    const slug = 'cristo-nossa-pascoa';
    registerEndpoint(`/api/articles/${slug}`, () => buildArticle(slug));

    const wrapper = await mountSuspended(ArticleDetailPage, { route: `/articles/${slug}` });

    expect(wrapper.find('header h1').text()).toContain('Cristo, Nossa Páscoa');
    expect(wrapper.text()).toContain('Pr. João');
    expect(wrapper.find('time').attributes('datetime')).toBe('2026-04-05');
    expect(wrapper.find('.article-content h1').text()).toBe('Ressurreição');
    expect(wrapper.find('.article-content strong').text()).toBe('paz');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('shows a not-found message when the article does not exist (404)', async () => {
    const slug = 'inexistente';
    registerEndpoint(`/api/articles/${slug}`, (event) => fail(event, 404));

    const wrapper = await mountSuspended(ArticleDetailPage, { route: `/articles/${slug}` });

    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Artigo não encontrado');
    expect(wrapper.find('.article-content').exists()).toBe(false);
  });

  it('shows a removed message when the article has been deleted (410)', async () => {
    const slug = 'removido';
    registerEndpoint(`/api/articles/${slug}`, (event) => fail(event, 410));

    const wrapper = await mountSuspended(ArticleDetailPage, { route: `/articles/${slug}` });

    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Este artigo foi removido');
    expect(wrapper.find('.article-content').exists()).toBe(false);
  });
});
