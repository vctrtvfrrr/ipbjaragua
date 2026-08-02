import { DEFAULT_SONG_SORT, type SongSort } from '@/db/queries/songs'

export type SongSortParams = { sort?: string | string[]; dir?: string | string[] }

export function resolveSongSort({ sort, dir }: SongSortParams): SongSort {
  if (sort !== 'title' && sort !== 'reference') return DEFAULT_SONG_SORT

  return { field: sort, direction: dir === 'desc' ? 'desc' : 'asc' }
}

export function songSortQuery(sort: SongSort): string {
  return `sort=${sort.field}&dir=${sort.direction}`
}

export function songListPath(sort: SongSort): string {
  return `/admin/songs?${songSortQuery(sort)}`
}
