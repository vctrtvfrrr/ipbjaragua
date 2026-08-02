'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useActionState, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { createSongFormAction, updateSongFormAction } from '@/app/(admin)/admin/songs/form-actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Form, FormActions, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Song } from '@/db/queries/songs'
import type { ActionState } from '@/lib/entity-action'
import { renumberLyrics } from '@/lib/lyrics'
import type { LyricsBlock } from '@/lib/song'
import { FieldError, FormError } from './FormFeedback'
import { LyricsBlocksEditor, validateLyricsBlocks } from './LyricsBlocksEditor'
import { ReferencePreview } from './ReferencePreview'

const INITIAL_STATE: ActionState = { status: 'idle' }
const EMPTY_LYRICS: LyricsBlock[] = [{ type: 'verse', number: 1, content: '' }]

type Props = ({ mode: 'create' } | { mode: 'edit'; song: Song }) & { listPath: string }

export function SongForm(props: Props) {
  const song = props.mode === 'edit' ? props.song : undefined
  const action = props.mode === 'edit' ? updateSongFormAction : createSongFormAction

  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE)
  const router = useRouter()

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const formError = state.status === 'error' ? state.formError : undefined
  const values = state.status === 'error' ? state.values : undefined

  const [title, setTitle] = useState(values?.title ?? song?.title ?? '')
  const [songwriter, setSongwriter] = useState(values?.songwriter ?? song?.songwriter ?? '')
  const [performer, setPerformer] = useState(values?.performer ?? song?.performer ?? '')
  const [album, setAlbum] = useState(values?.album ?? song?.album ?? '')
  const [track, setTrack] = useState(values?.track ?? (song?.track ? String(song.track) : ''))
  const [blocks, setBlocks] = useState<LyricsBlock[]>(() => renumberLyrics(song?.lyrics ?? EMPTY_LYRICS))
  const [lyricsErrors, setLyricsErrors] = useState<ReturnType<typeof validateLyricsBlocks>>({})

  const serializedLyrics = useMemo(() => JSON.stringify(renumberLyrics(blocks)), [blocks])

  useEffect(() => {
    if (state.status !== 'success') return
    toast.success(props.mode === 'edit' ? 'Cântico atualizado' : 'Cântico criado')
    router.push(props.listPath)
  }, [state.status, props.mode, props.listPath, router])

  function submit(event: FormEvent<HTMLFormElement>) {
    const errors = validateLyricsBlocks(blocks)
    if (errors.form || (errors.blocks && Object.keys(errors.blocks).length > 0)) {
      event.preventDefault()
      setLyricsErrors(errors)
    }
  }

  return (
    <Form action={formAction} onSubmit={submit}>
      <FormError message={formError} />

      {props.mode === 'edit' ? <input type="hidden" name="id" value={props.song.id} /> : null}
      <input type="hidden" name="lyrics" value={serializedLyrics} />

      <FormField>
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <FieldError messages={fieldErrors?.title} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField>
          <Label htmlFor="songwriter">Compositor</Label>
          <Input
            id="songwriter"
            name="songwriter"
            value={songwriter}
            onChange={(event) => setSongwriter(event.target.value)}
          />
          <FieldError messages={fieldErrors?.songwriter} />
        </FormField>

        <FormField>
          <Label htmlFor="performer">Intérprete</Label>
          <Input
            id="performer"
            name="performer"
            value={performer}
            onChange={(event) => setPerformer(event.target.value)}
          />
          <FieldError messages={fieldErrors?.performer} />
        </FormField>

        <FormField>
          <Label htmlFor="album">Álbum</Label>
          <Input id="album" name="album" value={album} onChange={(event) => setAlbum(event.target.value)} />
          <FieldError messages={fieldErrors?.album} />
        </FormField>

        <FormField>
          <Label htmlFor="track">Faixa</Label>
          <Input
            id="track"
            name="track"
            type="number"
            min="1"
            value={track}
            onChange={(event) => setTrack(event.target.value)}
          />
          <FieldError messages={fieldErrors?.track} />
        </FormField>
      </div>

      <ReferencePreview track={track} album={album} performer={performer} songwriter={songwriter} />

      <LyricsBlocksEditor
        blocks={blocks}
        onChange={setBlocks}
        errors={{
          form: lyricsErrors.form ?? fieldErrors?.lyrics,
          blocks: lyricsErrors.blocks,
        }}
        onErrorsChange={setLyricsErrors}
      />

      <FormActions>
        <Link href={props.listPath} className={cn(buttonVariants({ variant: 'outline' }))}>
          Cancelar
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </FormActions>
    </Form>
  )
}
