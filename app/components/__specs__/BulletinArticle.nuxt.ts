import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import BulletinArticle from '../BulletinArticle.vue';

describe('BulletinArticle', () => {
  it('renders html content', async () => {
    const wrapper = await mountSuspended(BulletinArticle, {
      props: { html: '<p>Estudo bíblico</p>' },
    });
    expect(wrapper.html()).toContain('Estudo bíblico');
  });

  it('applies bulletin-article class to the content wrapper', async () => {
    const wrapper = await mountSuspended(BulletinArticle, {
      props: { html: '<p>texto</p>' },
    });
    expect(wrapper.find('.bulletin-article').exists()).toBe(true);
  });

  it('renders nothing when html is empty', async () => {
    const wrapper = await mountSuspended(BulletinArticle, {
      props: { html: '' },
    });
    expect(wrapper.find('.bulletin-article').exists()).toBe(false);
  });

  it('renders nothing when html is omitted', async () => {
    const wrapper = await mountSuspended(BulletinArticle);
    expect(wrapper.find('.bulletin-article').exists()).toBe(false);
  });
});
