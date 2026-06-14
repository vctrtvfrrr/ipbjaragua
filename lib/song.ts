type SongFields = {
  track: number | null
  album: string | null
  performer: string | null
  songwriter: string | null
}

export function songReference(song: SongFields): string | null {
  if (song.track !== null && song.album !== null) return `${song.track}. ${song.album}`
  if (song.performer !== null) return song.performer
  if (song.songwriter !== null) return song.songwriter
  return null
}

export type LyricsBlock = { type: 'verse' | 'chorus' | string; number: number | null; content: string }

export function parseLyrics(raw: string): LyricsBlock[] {
  return JSON.parse(raw) as LyricsBlock[]
}
