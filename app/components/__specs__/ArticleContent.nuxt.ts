import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import ArticleContent from '../ArticleContent.vue';

describe('ArticleContent', () => {
  it('renders markdown converted to HTML', async () => {
    const wrapper = await mountSuspended(ArticleContent, {
      props: { markdown: '# Reflexão\n\nGraça e **paz**.' },
    });

    const root = wrapper.get('.article-content');
    expect(root.find('h1').text()).toBe('Reflexão');
    expect(root.find('strong').text()).toBe('paz');
  });

  it('renders nothing when markdown is empty', async () => {
    const wrapper = await mountSuspended(ArticleContent, {
      props: { markdown: '' },
    });
    expect(wrapper.find('.article-content').exists()).toBe(false);
  });
});
