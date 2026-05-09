import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import BulletinBirthdays from '../BulletinBirthdays.vue';

describe('BulletinBirthdays', () => {
  it('renders the section heading', async () => {
    const wrapper = await mountSuspended(BulletinBirthdays, {
      props: { html: '<p>João - 10/05</p>' },
    });
    expect(wrapper.find('h2').text()).toBe('Aniversariantes');
  });

  it('renders html content', async () => {
    const wrapper = await mountSuspended(BulletinBirthdays, {
      props: { html: '<p>João - 10/05</p>' },
    });
    expect(wrapper.html()).toContain('João - 10/05');
  });

  it('applies bulletin-birthdays class to the content wrapper', async () => {
    const wrapper = await mountSuspended(BulletinBirthdays, {
      props: { html: '<p>texto</p>' },
    });
    expect(wrapper.find('.bulletin-birthdays').exists()).toBe(true);
  });

  it('renders nothing when html is empty', async () => {
    const wrapper = await mountSuspended(BulletinBirthdays, {
      props: { html: '' },
    });
    expect(wrapper.find('h2').exists()).toBe(false);
  });

  it('renders nothing when html is omitted', async () => {
    const wrapper = await mountSuspended(BulletinBirthdays);
    expect(wrapper.find('h2').exists()).toBe(false);
  });
});
