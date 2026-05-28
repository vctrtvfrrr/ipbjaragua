export type ScripturePassage = { reference: string; text?: string; version?: string };

export type LyricsStanza = { type: 'verse' | 'chorus'; number: number; content: string };

export type SongData = { title: string; reference: string | null; lyrics: LyricsStanza[] | null };

type BaseMoment = { position: number; description: string | null };

export type LiturgyMoment =
  | (BaseMoment & { type: 'song'; song: SongData | null })
  | (BaseMoment & { type: 'bible_reading'; scripture_passages: ScripturePassage[] | null })
  | (BaseMoment & { type: 'prayer' })
  | (BaseMoment & {
      type: 'sermon';
      sermon_speaker: string | null;
      sermon_theme: string | null;
      scripture_passages: ScripturePassage[] | null;
    })
  | (BaseMoment & { type: 'sacrament'; sacrament_type: 'baptism' | 'eucharist' })
  | (BaseMoment & { type: 'pastoral_act' })
  | (BaseMoment & { type: 'other' });

export type LiturgyAct = { position: number; name: string; moments: LiturgyMoment[] };

export type LiturgyDetail = { id: number; date: string; theme: string; acts: LiturgyAct[] };

export type LiturgyListItem = { id: number; date: string; theme: string };

export type LiturgyListResponse = {
  data: LiturgyListItem[];
  pagination: { page: number; limit: number; total: number };
};
