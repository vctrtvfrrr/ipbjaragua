import { asc, desc, eq, sql } from 'drizzle-orm';
import type { DbInstance } from '../../db/client';
import { liturgies, liturgyActs, liturgyMoments, songs } from '../../db/schema';

export type ScripturePassage = { reference: string; text?: string; version?: string };

export type LyricsStanza = { type: 'verse' | 'chorus'; number: number; content: string };

type SongData = { title: string; reference: string | null; lyrics: LyricsStanza[] | null };

type BaseMoment = { position: number };

export type LiturgyMoment =
  | (BaseMoment & { type: 'song'; song: SongData | null })
  | (BaseMoment & { type: 'bible_reading'; scripture_passages: ScripturePassage[] | null })
  | (BaseMoment & { type: 'prayer'; description: string | null })
  | (BaseMoment & { type: 'sermon'; sermon_speaker: string | null; sermon_reference: string | null; sermon_theme: string | null })
  | (BaseMoment & { type: 'sacrament'; sacrament_type: 'baptism' | 'eucharist' | null })
  | (BaseMoment & { type: 'pastoral_act'; description: string | null })
  | (BaseMoment & { type: 'other'; description: string | null });

export type LiturgyAct = { position: number; name: string; moments: LiturgyMoment[] };

export type LiturgyDetail = { id: number; date: string; theme: string | null; acts: LiturgyAct[] };

export type LiturgyListItem = { id: number; date: string; theme: string | null };

export type LiturgyListResponse = {
  data: LiturgyListItem[];
  pagination: { page: number; limit: number; total: number };
};

export function listLiturgies(db: DbInstance, page: number, limit: number): LiturgyListResponse {
  const totalRow = db.select({ count: sql<number>`COUNT(*)` }).from(liturgies).get();
  const total = totalRow?.count ?? 0;

  const data = db
    .select({ id: liturgies.id, date: liturgies.date, theme: liturgies.theme })
    .from(liturgies)
    .orderBy(desc(liturgies.date))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  return { data, pagination: { page, limit, total } };
}

type MomentRow = {
  moment: typeof liturgyMoments.$inferSelect;
  songTitle: string | null;
  songSongwriter: string | null;
  songPerformer: string | null;
  songAlbum: string | null;
  songTrack: number | null;
  songLyrics: string | null;
};

function buildSongReference(track: number | null, album: string | null, performer: string | null, songwriter: string | null): string | null {
  if (track !== null && album !== null) return `${track}. ${album}`;
  if (performer !== null) return performer;
  if (songwriter !== null) return songwriter;
  return null;
}

function buildMoment({ moment, songTitle, songSongwriter, songPerformer, songAlbum, songTrack, songLyrics }: MomentRow): LiturgyMoment {
  const base = { position: moment.position };

  switch (moment.type) {
    case 'song': {
      let lyrics: LyricsStanza[] | null = null;
      if (songLyrics) {
        try {
          lyrics = JSON.parse(songLyrics) as LyricsStanza[];
        } catch {
          lyrics = null;
        }
      }
      const song: SongData | null = songTitle
        ? { title: songTitle, reference: buildSongReference(songTrack, songAlbum, songPerformer, songSongwriter), lyrics }
        : null;
      return { ...base, type: 'song', song };
    }
    case 'bible_reading': {
      let scripture_passages: ScripturePassage[] | null = null;
      if (moment.scripture_passages) {
        try {
          scripture_passages = JSON.parse(moment.scripture_passages) as ScripturePassage[];
        } catch {
          scripture_passages = null;
        }
      }
      return { ...base, type: 'bible_reading', scripture_passages };
    }
    case 'prayer':
      return { ...base, type: 'prayer', description: moment.description };
    case 'sermon':
      return { ...base, type: 'sermon', sermon_speaker: moment.sermon_speaker, sermon_reference: moment.sermon_reference, sermon_theme: moment.sermon_theme };
    case 'sacrament':
      return { ...base, type: 'sacrament', sacrament_type: moment.sacrament_type };
    case 'pastoral_act':
      return { ...base, type: 'pastoral_act', description: moment.description };
    case 'other':
      return { ...base, type: 'other', description: moment.description };
  }
}

export function getLiturgy(db: DbInstance, date: string): LiturgyDetail | null {
  const liturgy = db.select().from(liturgies).where(eq(liturgies.date, date)).limit(1).get();
  if (!liturgy) return null;

  const acts = db
    .select()
    .from(liturgyActs)
    .where(eq(liturgyActs.liturgy_id, liturgy.id))
    .orderBy(asc(liturgyActs.position))
    .all();

  const builtActs: LiturgyAct[] = acts.map((act) => {
    const rows = db
      .select({
        moment: liturgyMoments,
        songTitle: songs.title,
        songSongwriter: songs.songwriter,
        songPerformer: songs.performer,
        songAlbum: songs.album,
        songTrack: songs.track,
        songLyrics: songs.lyrics,
      })
      .from(liturgyMoments)
      .leftJoin(songs, eq(songs.id, liturgyMoments.song_id))
      .where(eq(liturgyMoments.act_id, act.id))
      .orderBy(asc(liturgyMoments.position))
      .all();

    return { position: act.position, name: act.name, moments: rows.map(buildMoment) };
  });

  return { id: liturgy.id, date: liturgy.date, theme: liturgy.theme, acts: builtActs };
}
