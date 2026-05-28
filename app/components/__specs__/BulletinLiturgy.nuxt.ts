import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import type { LiturgyDetail, LiturgyMoment } from '~~/shared/liturgy';
import BulletinLiturgy from '../BulletinLiturgy.vue';

function buildLiturgy(moments: LiturgyMoment[], theme = 'Tema do Culto', actName = 'Abertura'): LiturgyDetail {
  return {
    id: 1,
    date: '2026-05-17',
    theme,
    acts: [{ position: 1, name: actName, moments }],
  };
}

describe('BulletinLiturgy', () => {
  it('renders nothing when liturgy is null', async () => {
    const wrapper = await mountSuspended(BulletinLiturgy, { props: { liturgy: null } });
    expect(wrapper.find('section.bulletin-liturgy').exists()).toBe(false);
  });

  it('renders the theme as the section heading', async () => {
    const liturgy = buildLiturgy([], 'Cristo, Nossa Páscoa');
    const wrapper = await mountSuspended(BulletinLiturgy, { props: { liturgy } });
    expect(wrapper.find('h2').text()).toBe('Cristo, Nossa Páscoa');
  });

  it('renders each act with an h3 and a list of moments', async () => {
    const liturgy: LiturgyDetail = {
      id: 1,
      date: '2026-05-17',
      theme: 'T',
      acts: [
        {
          position: 1,
          name: 'Abertura',
          moments: [{ position: 1, type: 'prayer', description: 'Invocação' }],
        },
        {
          position: 2,
          name: 'Mensagem',
          moments: [{ position: 1, type: 'prayer', description: 'Oração final' }],
        },
      ],
    };
    const wrapper = await mountSuspended(BulletinLiturgy, { props: { liturgy } });
    const h3s = wrapper.findAll('h3');
    expect(h3s.map((h) => h.text())).toEqual(['Abertura', 'Mensagem']);
  });

  it('prayer moment renders description inside a strong tag', async () => {
    const liturgy = buildLiturgy([{ position: 1, type: 'prayer', description: 'Oração de intercessão' }]);
    const wrapper = await mountSuspended(BulletinLiturgy, { props: { liturgy } });
    const strong = wrapper.find('li strong');
    expect(strong.text()).toBe('Oração de intercessão');
  });

  it('pastoral_act and other moments render description inside a strong tag', async () => {
    const liturgy = buildLiturgy([
      { position: 1, type: 'pastoral_act', description: 'Bênção' },
      { position: 2, type: 'other', description: 'Saudação' },
    ]);
    const wrapper = await mountSuspended(BulletinLiturgy, { props: { liturgy } });
    const strongs = wrapper.findAll('li strong');
    expect(strongs.map((s) => s.text())).toEqual(['Bênção', 'Saudação']);
  });

  it('song moment renders title in h4 with small reference and prefix label', async () => {
    const liturgy = buildLiturgy([
      {
        position: 1,
        type: 'song',
        description: null,
        song: { title: 'Grande Redenção', reference: '45. Novo Cântico', lyrics: null },
      },
    ]);
    const wrapper = await mountSuspended(BulletinLiturgy, { props: { liturgy } });
    expect(wrapper.find('li strong').text()).toBe('Cântico:');
    const h4 = wrapper.find('li h4');
    expect(h4.text()).toContain('Grande Redenção');
    expect(h4.find('small').text()).toBe('45. Novo Cântico');
  });

  it('song moment renders verses with number prefix and chorus without', async () => {
    const liturgy = buildLiturgy([
      {
        position: 1,
        type: 'song',
        description: null,
        song: {
          title: 'Hino',
          reference: null,
          lyrics: [
            { type: 'verse', number: 1, content: 'Linha um\nLinha dois' },
            { type: 'chorus', number: 1, content: 'Refrão linha um' },
          ],
        },
      },
    ]);
    const wrapper = await mountSuspended(BulletinLiturgy, { props: { liturgy } });
    const verse = wrapper.find('p.song-verse');
    expect(verse.text()).toContain('1.');
    expect(verse.text()).toContain('Linha um');
    expect(verse.find('br').exists()).toBe(true);
    const chorus = wrapper.find('p.song-chorus');
    expect(chorus.text()).toContain('Refrão linha um');
    expect(chorus.text()).not.toMatch(/^\s*\d\./);
  });

  it('song moment renders description below the music block when present', async () => {
    const liturgy = buildLiturgy([
      {
        position: 1,
        type: 'song',
        description: 'Congregação em pé',
        song: { title: 'Hino', reference: null, lyrics: null },
      },
    ]);
    const wrapper = await mountSuspended(BulletinLiturgy, { props: { liturgy } });
    const ps = wrapper.findAll('li > p');
    expect(ps.at(-1)?.text()).toBe('Congregação em pé');
  });

  it('bible_reading moment renders passages with cite and blockquote, description first', async () => {
    const liturgy = buildLiturgy([
      {
        position: 1,
        type: 'bible_reading',
        description: 'Leitura responsiva',
        scripture_passages: [
          { reference: 'João 3:16', text: 'Porque Deus amou o mundo...', version: 'ARA' },
          { reference: 'Salmo 23:1' },
        ],
      },
    ]);
    const wrapper = await mountSuspended(BulletinLiturgy, { props: { liturgy } });
    expect(wrapper.find('li > p').text()).toBe('Leitura responsiva');
    const passages = wrapper.findAll('div.bible-passage');
    expect(passages).toHaveLength(2);
    expect(passages[0]?.find('cite').text()).toBe('João 3:16 (ARA)');
    expect(passages[0]?.find('blockquote').text()).toContain('Porque Deus amou');
    expect(passages[1]?.find('cite').text()).toBe('Salmo 23:1');
    expect(passages[1]?.find('blockquote').exists()).toBe(false);
  });

  it('sermon moment renders theme as strong, speaker as p, and scripture passages', async () => {
    const liturgy = buildLiturgy([
      {
        position: 1,
        type: 'sermon',
        description: null,
        sermon_theme: 'A Graça que Salva',
        sermon_speaker: 'Pr. João',
        scripture_passages: [{ reference: 'Rm 8:28' }],
      },
    ]);
    const wrapper = await mountSuspended(BulletinLiturgy, { props: { liturgy } });
    const li = wrapper.find('li');
    expect(li.find('strong').text()).toBe('A Graça que Salva');
    expect(li.find('p').text()).toBe('Pr. João');
    expect(li.find('div.bible-passage cite').text()).toBe('Rm 8:28');
  });

  it('sacrament moment renders pt-BR label and optional description', async () => {
    const liturgy = buildLiturgy([
      { position: 1, type: 'sacrament', description: 'Famílias convidadas', sacrament_type: 'baptism' },
      { position: 2, type: 'sacrament', description: null, sacrament_type: 'eucharist' },
    ]);
    const wrapper = await mountSuspended(BulletinLiturgy, { props: { liturgy } });
    const lis = wrapper.findAll('li');
    expect(lis[0]?.find('strong').text()).toBe('Batismo');
    expect(lis[0]?.find('p').text()).toBe('Famílias convidadas');
    expect(lis[1]?.find('strong').text()).toBe('Santa Ceia');
    expect(lis[1]?.find('p').exists()).toBe(false);
  });
});
