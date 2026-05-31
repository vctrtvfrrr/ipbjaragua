import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import type { BirthdayGroup } from '~~/shared/bulletin';
import BulletinBirthdays from '../BulletinBirthdays.vue';

function buildGroup(date: string, names: string[]): BirthdayGroup {
  return { date, weekday: 'Domingo', names };
}

describe('BulletinBirthdays', () => {
  it('renders nothing when birthdays is null (section disabled)', async () => {
    const wrapper = await mountSuspended(BulletinBirthdays, { props: { birthdays: null } });
    expect(wrapper.find('h2').exists()).toBe(false);
  });

  it('renders section heading when birthdays is an empty array', async () => {
    const wrapper = await mountSuspended(BulletinBirthdays, { props: { birthdays: [] } });
    expect(wrapper.find('h2').text()).toBe('Aniversariantes');
  });

  it('shows placeholder text when birthdays is empty', async () => {
    const wrapper = await mountSuspended(BulletinBirthdays, { props: { birthdays: [] } });
    expect(wrapper.text()).toContain('Nenhum aniversariante esta semana.');
  });

  it('renders birthday group with day/month and weekday heading', async () => {
    const wrapper = await mountSuspended(BulletinBirthdays, {
      props: { birthdays: [buildGroup('2026-05-17', ['João Silva'])] },
    });
    expect(wrapper.find('h3').text()).toBe('17/05 — Domingo');
    expect(wrapper.text()).toContain('João Silva');
  });

  it('renders multiple names in a group', async () => {
    const wrapper = await mountSuspended(BulletinBirthdays, {
      props: { birthdays: [buildGroup('2026-05-17', ['João', 'Maria'])] },
    });
    const items = wrapper.findAll('li');
    expect(items).toHaveLength(2);
  });

  it('renders multiple groups', async () => {
    const wrapper = await mountSuspended(BulletinBirthdays, {
      props: {
        birthdays: [buildGroup('2026-05-17', ['João']), buildGroup('2026-05-20', ['Maria'])],
      },
    });
    expect(wrapper.findAll('.bulletin-birthday-group')).toHaveLength(2);
  });
});
