import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { beforeEach, describe, expect, test } from 'vitest';
import * as schema from '../../../db/schema';
import { getLiturgy, listLiturgies } from '../liturgy';

const testDb = drizzle(new Database(':memory:'), { schema });
migrate(testDb, { migrationsFolder: './server/db/migrations' });

describe('listLiturgies', () => {
  beforeEach(() => {
    testDb.delete(schema.liturgies).run();
  });

  test('returns empty data with zero total when no liturgies exist', () => {
    const result = listLiturgies(testDb, 1, 10);
    expect(result).toEqual({ data: [], pagination: { page: 1, limit: 10, total: 0 } });
  });

  test('returns liturgies ordered most recent first', () => {
    testDb
      .insert(schema.liturgies)
      .values([
        { date: '2026-04-19', theme: 'Tema A' },
        { date: '2026-05-17', theme: 'Tema B' },
        { date: '2026-05-03', theme: null },
      ])
      .run();

    const result = listLiturgies(testDb, 1, 10);
    expect(result.data.map((l) => l.date)).toEqual(['2026-05-17', '2026-05-03', '2026-04-19']);
    expect(result.pagination.total).toBe(3);
  });

  test('paginates correctly', () => {
    testDb
      .insert(schema.liturgies)
      .values([{ date: '2026-05-17' }, { date: '2026-05-10' }, { date: '2026-05-03' }, { date: '2026-04-26' }])
      .run();

    const page1 = listLiturgies(testDb, 1, 2);
    expect(page1.data.map((l) => l.date)).toEqual(['2026-05-17', '2026-05-10']);
    expect(page1.pagination).toEqual({ page: 1, limit: 2, total: 4 });

    const page2 = listLiturgies(testDb, 2, 2);
    expect(page2.data.map((l) => l.date)).toEqual(['2026-05-03', '2026-04-26']);
    expect(page2.pagination).toEqual({ page: 2, limit: 2, total: 4 });
  });
});

describe('getLiturgy', () => {
  beforeEach(() => {
    testDb.delete(schema.liturgyMoments).run();
    testDb.delete(schema.liturgyActs).run();
    testDb.delete(schema.liturgies).run();
    testDb.delete(schema.songs).run();
  });

  test('returns null when no liturgy exists for the date', () => {
    expect(getLiturgy(testDb, '2026-05-17')).toBeNull();
  });

  test('returns liturgy with empty acts array when no acts exist', () => {
    testDb.insert(schema.liturgies).values({ date: '2026-05-17', theme: 'Tema' }).run();

    const result = getLiturgy(testDb, '2026-05-17');
    expect(result).not.toBeNull();
    expect(result?.acts).toEqual([]);
  });

  test('orders acts by position, not by insertion order', () => {
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    // Insert in reverse position order so id order diverges from position order
    const [act2] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 2, name: 'Mensagem' })
      .returning()
      .all();
    const [act1] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Abertura' })
      .returning()
      .all();
    testDb.insert(schema.liturgyMoments).values({ act_id: act2.id, position: 1, type: 'sermon' }).run();
    testDb.insert(schema.liturgyMoments).values({ act_id: act1.id, position: 1, type: 'prayer' }).run();

    const result = getLiturgy(testDb, '2026-05-17');
    expect(result?.acts[0].name).toBe('Abertura');
    expect(result?.acts[1].name).toBe('Mensagem');
  });

  test('orders moments by position, not by insertion order', () => {
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    const [act] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Abertura' })
      .returning()
      .all();
    // Insert in reverse position order so id order diverges from position order
    testDb
      .insert(schema.liturgyMoments)
      .values([
        { act_id: act.id, position: 2, type: 'prayer' },
        { act_id: act.id, position: 1, type: 'other', description: 'Entrada' },
      ])
      .run();

    const result = getLiturgy(testDb, '2026-05-17');
    expect(result?.acts[0].moments[0].type).toBe('other');
    expect(result?.acts[0].moments[1].type).toBe('prayer');
  });

  test('song moment: reference uses track+album when both present', () => {
    const [song] = testDb
      .insert(schema.songs)
      .values({ slug: 'grande-redenção', title: 'Grande Redenção', album: 'Novo Cântico', track: 45 })
      .returning()
      .all();
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    const [act] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Louvor' })
      .returning()
      .all();
    testDb.insert(schema.liturgyMoments).values({ act_id: act.id, position: 1, type: 'song', song_id: song.id }).run();

    const moment = getLiturgy(testDb, '2026-05-17')?.acts[0].moments[0];
    if (moment?.type !== 'song') return;
    expect(moment.song?.reference).toBe('45. Novo Cântico');
  });

  test('song moment: reference uses performer when no track+album', () => {
    const [song] = testDb
      .insert(schema.songs)
      .values({ slug: 'consagração', title: 'Consagração', performer: 'Aline Barros', songwriter: 'Compositor' })
      .returning()
      .all();
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    const [act] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Louvor' })
      .returning()
      .all();
    testDb.insert(schema.liturgyMoments).values({ act_id: act.id, position: 1, type: 'song', song_id: song.id }).run();

    const moment = getLiturgy(testDb, '2026-05-17')?.acts[0].moments[0];
    if (moment?.type !== 'song') return;
    expect(moment.song?.reference).toBe('Aline Barros');
  });

  test('song moment: reference uses songwriter when no track+album+performer', () => {
    const [song] = testDb
      .insert(schema.songs)
      .values({ slug: 'hino', title: 'Hino', songwriter: 'Autor Desconhecido' })
      .returning()
      .all();
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    const [act] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Louvor' })
      .returning()
      .all();
    testDb.insert(schema.liturgyMoments).values({ act_id: act.id, position: 1, type: 'song', song_id: song.id }).run();

    const moment = getLiturgy(testDb, '2026-05-17')?.acts[0].moments[0];
    if (moment?.type !== 'song') return;
    expect(moment.song?.reference).toBe('Autor Desconhecido');
  });

  test('song moment: reference is null when no track, album, performer, or songwriter', () => {
    const [song] = testDb.insert(schema.songs).values({ slug: 'sem-info', title: 'Sem Informação' }).returning().all();
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    const [act] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Louvor' })
      .returning()
      .all();
    testDb.insert(schema.liturgyMoments).values({ act_id: act.id, position: 1, type: 'song', song_id: song.id }).run();

    const moment = getLiturgy(testDb, '2026-05-17')?.acts[0].moments[0];
    if (moment?.type !== 'song') return;
    expect(moment.song?.reference).toBeNull();
  });

  test('song moment: includes title, reference and lyrics; excludes raw metadata fields', () => {
    const stanzas = [{ type: 'verse', number: 1, content: 'Letra' }];
    const [song] = testDb
      .insert(schema.songs)
      .values({
        slug: 'ainda-que-a-figueira',
        title: 'Ainda Que a Figueira',
        album: 'Álbum',
        track: 3,
        lyrics: JSON.stringify(stanzas),
      })
      .returning()
      .all();
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    const [act] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Louvor' })
      .returning()
      .all();
    testDb.insert(schema.liturgyMoments).values({ act_id: act.id, position: 1, type: 'song', song_id: song.id }).run();

    const moment = getLiturgy(testDb, '2026-05-17')?.acts[0].moments[0];
    if (moment?.type !== 'song') return;
    expect(moment.song).toEqual({ title: 'Ainda Que a Figueira', reference: '3. Álbum', lyrics: stanzas });
    expect(Object.keys(moment)).toEqual(['position', 'type', 'song']);
  });

  test('song moment: song is null when no song_id', () => {
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    const [act] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Louvor' })
      .returning()
      .all();
    testDb.insert(schema.liturgyMoments).values({ act_id: act.id, position: 1, type: 'song' }).run();

    const moment = getLiturgy(testDb, '2026-05-17')?.acts[0].moments[0];
    if (moment?.type !== 'song') return;
    expect(moment.song).toBeNull();
  });

  test('song moment: lyrics null when JSON is invalid', () => {
    const [song] = testDb
      .insert(schema.songs)
      .values({ slug: 'musica-corrompida', title: 'Música', lyrics: 'not valid json{{{' })
      .returning()
      .all();
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    const [act] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Louvor' })
      .returning()
      .all();
    testDb.insert(schema.liturgyMoments).values({ act_id: act.id, position: 1, type: 'song', song_id: song.id }).run();

    const moment = getLiturgy(testDb, '2026-05-17')?.acts[0].moments[0];
    if (moment?.type !== 'song') return;
    expect(moment.song?.lyrics).toBeNull();
  });

  test('bible_reading moment: includes parsed scripture_passages, excludes unrelated fields', () => {
    const passages = [{ reference: 'João 3:16', text: 'Porque Deus amou...', version: 'ARA' }];
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    const [act] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Leitura' })
      .returning()
      .all();
    testDb
      .insert(schema.liturgyMoments)
      .values({ act_id: act.id, position: 1, type: 'bible_reading', scripture_passages: JSON.stringify(passages) })
      .run();

    const moment = getLiturgy(testDb, '2026-05-17')?.acts[0].moments[0];
    if (moment?.type !== 'bible_reading') return;
    expect(moment.scripture_passages).toEqual(passages);
    expect(Object.keys(moment)).toEqual(['position', 'type', 'scripture_passages']);
  });

  test('bible_reading moment: scripture_passages null when JSON is invalid', () => {
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    const [act] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Leitura' })
      .returning()
      .all();
    testDb
      .insert(schema.liturgyMoments)
      .values({ act_id: act.id, position: 1, type: 'bible_reading', scripture_passages: 'not valid json{{{' })
      .run();

    const moment = getLiturgy(testDb, '2026-05-17')?.acts[0].moments[0];
    if (moment?.type !== 'bible_reading') return;
    expect(moment.scripture_passages).toBeNull();
  });

  test('sermon moment: includes sermon fields, excludes unrelated fields', () => {
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    const [act] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Mensagem' })
      .returning()
      .all();
    testDb
      .insert(schema.liturgyMoments)
      .values({
        act_id: act.id,
        position: 1,
        type: 'sermon',
        sermon_speaker: 'Pr. João',
        sermon_reference: 'Rm 8:28',
        sermon_theme: 'Providência',
      })
      .run();

    const moment = getLiturgy(testDb, '2026-05-17')?.acts[0].moments[0];
    if (moment?.type !== 'sermon') return;
    expect(moment.sermon_speaker).toBe('Pr. João');
    expect(moment.sermon_reference).toBe('Rm 8:28');
    expect(moment.sermon_theme).toBe('Providência');
    expect(Object.keys(moment)).toEqual(['position', 'type', 'sermon_speaker', 'sermon_reference', 'sermon_theme']);
  });

  test('sacrament moment: includes sacrament_type, excludes unrelated fields', () => {
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    const [act] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Sacramento' })
      .returning()
      .all();
    testDb
      .insert(schema.liturgyMoments)
      .values({ act_id: act.id, position: 1, type: 'sacrament', sacrament_type: 'eucharist' })
      .run();

    const moment = getLiturgy(testDb, '2026-05-17')?.acts[0].moments[0];
    if (moment?.type !== 'sacrament') return;
    expect(moment.sacrament_type).toBe('eucharist');
    expect(Object.keys(moment)).toEqual(['position', 'type', 'sacrament_type']);
  });

  test('prayer moment: includes description, excludes unrelated fields', () => {
    const [liturgy] = testDb.insert(schema.liturgies).values({ date: '2026-05-17' }).returning().all();
    const [act] = testDb
      .insert(schema.liturgyActs)
      .values({ liturgy_id: liturgy.id, position: 1, name: 'Oração' })
      .returning()
      .all();
    testDb
      .insert(schema.liturgyMoments)
      .values({ act_id: act.id, position: 1, type: 'prayer', description: 'Oração de intercessão' })
      .run();

    const moment = getLiturgy(testDb, '2026-05-17')?.acts[0].moments[0];
    if (moment?.type !== 'prayer') return;
    expect(moment.description).toBe('Oração de intercessão');
    expect(Object.keys(moment)).toEqual(['position', 'type', 'description']);
  });
});
