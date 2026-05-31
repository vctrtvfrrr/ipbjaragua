import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import type { ArticleDetail } from '~~/shared/article';
import BulletinArticle from '../BulletinArticle.vue';

function buildArticle(overrides: Partial<ArticleDetail> = {}): ArticleDetail {
  return {
    id: 1,
    slug: 'estudo-biblico',
    title: 'Estudo Bíblico',
    author: 'Pastor Silva',
    date: '2026-05-17',
    content: 'Conteúdo do artigo.',
    ...overrides,
  };
}

describe('BulletinArticle', () => {
  it('renders nothing when article is null', async () => {
    const wrapper = await mountSuspended(BulletinArticle, { props: { article: null } });
    expect(wrapper.find('.bulletin-article').exists()).toBe(false);
  });

  it('renders the article title', async () => {
    const wrapper = await mountSuspended(BulletinArticle, { props: { article: buildArticle() } });
    expect(wrapper.find('h2').text()).toBe('Estudo Bíblico');
  });

  it('renders the author when present', async () => {
    const wrapper = await mountSuspended(BulletinArticle, { props: { article: buildArticle() } });
    expect(wrapper.text()).toContain('Pastor Silva');
  });

  it('does not render author element when author is null', async () => {
    const wrapper = await mountSuspended(BulletinArticle, {
      props: { article: buildArticle({ author: null }) },
    });
    expect(wrapper.find('p.italic').exists()).toBe(false);
  });

  it('applies bulletin-article class to the wrapper', async () => {
    const wrapper = await mountSuspended(BulletinArticle, { props: { article: buildArticle() } });
    expect(wrapper.find('.bulletin-article').exists()).toBe(true);
  });
});
