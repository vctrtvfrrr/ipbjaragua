'use client'

import { songReference } from '@/lib/song'

type Props = {
  track: string
  album: string
  performer: string
  songwriter: string
}

export function ReferencePreview({ track, album, performer, songwriter }: Props) {
  const reference = songReference({
    track: track ? Number(track) : null,
    album: album.trim() || null,
    performer: performer.trim() || null,
    songwriter: songwriter.trim() || null,
  })

  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground text-xs font-medium">Referência</p>
      <p className="mt-1 text-sm">{reference ?? 'Sem referência'}</p>
    </div>
  )
}
