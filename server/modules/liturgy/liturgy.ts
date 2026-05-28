import { asc, desc, eq, sql } from 'drizzle-orm';
import type {
  LiturgyAct,
  LiturgyDetail,
  LiturgyListResponse,
  LiturgyMoment,
  LyricsStanza,
  ScripturePassage,
  SongData,
} from '../../../shared/liturgy';
import type { DbInstance } from '../../db/client';
import { liturgies, liturgyActs, liturgyMoments, songs } from '../../db/schema';

export type {
  LiturgyAct,
  LiturgyDetail,
  LiturgyListItem,
  LiturgyListResponse,
  LiturgyMoment,
  LyricsStanza,
  ScripturePassage,
  SongData,
} from '../../../shared/liturgy';

export function listLiturgies(db: DbInstance, page: number, limit: number): LiturgyListResponse {
  const totalRow = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(liturgies)
    .get();
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

function buildSongReference(
  track: number | null,
  album: string | null,
  performer: string | null,
  songwriter: string | null,
): string | null {
  if (track !== null && album !== null) return `${track}. ${album}`;
  if (performer !== null) return performer;
  if (songwriter !== null) return songwriter;
  return null;
}

function parseScripturePassages(raw: string | null): ScripturePassage[] | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ScripturePassage[];
  } catch {
    return null;
  }
}

function buildMoment({
  moment,
  songTitle,
  songSongwriter,
  songPerformer,
  songAlbum,
  songTrack,
  songLyrics,
}: MomentRow): LiturgyMoment {
  const base = { position: moment.position, description: moment.description };

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
        ? {
            title: songTitle,
            reference: buildSongReference(songTrack, songAlbum, songPerformer, songSongwriter),
            lyrics,
          }
        : null;
      return { ...base, type: 'song', song };
    }
    case 'bible_reading':
      return { ...base, type: 'bible_reading', scripture_passages: parseScripturePassages(moment.scripture_passages) };
    case 'prayer':
      return { ...base, type: 'prayer' };
    case 'sermon':
      return {
        ...base,
        type: 'sermon',
        sermon_speaker: moment.sermon_speaker,
        sermon_theme: moment.sermon_theme,
        scripture_passages: parseScripturePassages(moment.scripture_passages),
      };
    case 'sacrament': {
      if (moment.sacrament_type === null) {
        throw new Error(`Sacrament moment ${moment.id} is missing sacrament_type (violates DB CHECK constraint)`);
      }
      return { ...base, type: 'sacrament', sacrament_type: moment.sacrament_type };
    }
    case 'pastoral_act':
      return { ...base, type: 'pastoral_act' };
    case 'other':
      return { ...base, type: 'other' };
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
