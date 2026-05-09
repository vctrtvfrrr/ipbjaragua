import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import BulletinAnnouncements from '../BulletinAnnouncements.vue';

describe('BulletinAnnouncements', () => {
  it('renders the section heading', async () => {
    const wrapper = await mountSuspended(BulletinAnnouncements, {
      props: { html: '<p>Aviso importante</p>' },
    });
    expect(wrapper.find('h2').text()).toBe('Avisos');
  });

  it('renders html content', async () => {
    const wrapper = await mountSuspended(BulletinAnnouncements, {
      props: { html: '<p>Aviso importante</p>' },
    });
    expect(wrapper.html()).toContain('Aviso importante');
  });

  it('applies bulletin-announcements class to the content wrapper', async () => {
    const wrapper = await mountSuspended(BulletinAnnouncements, {
      props: { html: '<p>texto</p>' },
    });
    expect(wrapper.find('.bulletin-announcements').exists()).toBe(true);
  });

  it('renders nothing when html is empty', async () => {
    const wrapper = await mountSuspended(BulletinAnnouncements, {
      props: { html: '' },
    });
    expect(wrapper.find('h2').exists()).toBe(false);
  });

  it('renders nothing when html is omitted', async () => {
    const wrapper = await mountSuspended(BulletinAnnouncements);
    expect(wrapper.find('h2').exists()).toBe(false);
  });
});
