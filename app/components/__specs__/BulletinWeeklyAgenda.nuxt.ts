import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import type { AgendaGroup } from '~~/shared/bulletin';
import BulletinWeeklyAgenda from '../BulletinWeeklyAgenda.vue';

function buildGroup(weekday: string, events: AgendaGroup['events'] = []): AgendaGroup {
  return { weekday, events };
}

describe('BulletinWeeklyAgenda', () => {
  it('renders nothing when agenda is null (section disabled)', async () => {
    const wrapper = await mountSuspended(BulletinWeeklyAgenda, { props: { agenda: null } });
    expect(wrapper.find('h2').exists()).toBe(false);
  });

  it('renders section heading when agenda is an empty array', async () => {
    const wrapper = await mountSuspended(BulletinWeeklyAgenda, { props: { agenda: [] } });
    expect(wrapper.find('h2').text()).toBe('Agenda Semanal');
  });

  it('shows placeholder text when agenda is empty', async () => {
    const wrapper = await mountSuspended(BulletinWeeklyAgenda, { props: { agenda: [] } });
    expect(wrapper.text()).toContain('Nenhum evento nesta semana.');
  });

  it('renders a weekday group heading', async () => {
    const wrapper = await mountSuspended(BulletinWeeklyAgenda, {
      props: { agenda: [buildGroup('Segunda-feira', [{ time: '19:30', title: 'Reunião', description: null }])] },
    });
    expect(wrapper.find('h3').text()).toBe('Segunda-feira');
  });

  it('renders event title and time', async () => {
    const wrapper = await mountSuspended(BulletinWeeklyAgenda, {
      props: { agenda: [buildGroup('Quarta-feira', [{ time: '19:30', title: 'Estudo Bíblico', description: null }])] },
    });
    expect(wrapper.text()).toContain('19:30');
    expect(wrapper.text()).toContain('Estudo Bíblico');
  });

  it('renders event description when present', async () => {
    const wrapper = await mountSuspended(BulletinWeeklyAgenda, {
      props: {
        agenda: [buildGroup('Domingo', [{ time: null, title: 'Culto', description: 'Manhã e tarde' }])],
      },
    });
    expect(wrapper.text()).toContain('Manhã e tarde');
  });

  it('renders the event description as markdown', async () => {
    const wrapper = await mountSuspended(BulletinWeeklyAgenda, {
      props: {
        agenda: [buildGroup('Domingo', [{ time: null, title: 'Culto', description: 'Veja **agora**' }])],
      },
    });
    const description = wrapper.find('.agenda-event-description');
    expect(description.find('strong').text()).toBe('agora');
  });

  it('renders multiple groups', async () => {
    const wrapper = await mountSuspended(BulletinWeeklyAgenda, {
      props: {
        agenda: [
          buildGroup('Segunda-feira', [{ time: null, title: 'Reunião', description: null }]),
          buildGroup('Quarta-feira', [{ time: null, title: 'Estudo', description: null }]),
        ],
      },
    });
    expect(wrapper.findAll('.bulletin-agenda-group')).toHaveLength(2);
  });
});
