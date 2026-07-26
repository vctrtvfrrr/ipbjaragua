'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createLiturgyFormAction,
  unpublishLiturgyFormAction,
  updateLiturgyFormAction,
} from '@/app/(admin)/admin/liturgies/form-actions'
import { generateLiturgyDescriptionAction } from '@/app/(admin)/admin/liturgies/form-actions'
import type { LiturgyEditorData, SongPickerOption } from '@/db/queries/liturgies'
import { formatISODate } from '@/lib/date'
import {
  buildLiturgyActErrorSummary,
  liturgyActLabel,
  MOMENT_TYPE_LABELS,
  MOMENT_TYPES,
  SACRAMENT_TYPE_LABELS,
  draftLiturgyTreeSchema,
  liturgyTreeSchema,
  type LiturgyFormDefaults,
  type LiturgyStatus,
  type MomentType,
  type SacramentType,
} from '@/lib/liturgy'
import type { ActionState } from '@/lib/entity-action'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Form, FormActions, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FieldError, FormError } from './FormFeedback'

const INITIAL_STATE: ActionState = { status: 'idle' }

type PassageDraft = { reference: string; text: string; version: string }
type MomentDraft = {
  key: string
  id?: number
  type: MomentType
  description: string
  song_id: number | null
  scripture_passages: PassageDraft[]
  sermon_speaker: string
  sacrament_type: SacramentType | null
}
type ActDraft = { key: string; id?: number; name: string; moments: MomentDraft[] }
type FormErrors = Record<string, string[]>

type Props =
  | { mode: 'create'; songs: SongPickerOption[]; defaults?: LiturgyFormDefaults }
  | { mode: 'edit'; liturgy: LiturgyEditorData; songs: SongPickerOption[] }

export function LiturgyForm(props: Props) {
  const action = props.mode === 'edit' ? updateLiturgyFormAction : createLiturgyFormAction
  const liturgy = props.mode === 'edit' ? props.liturgy : undefined
  const defaults = props.mode === 'create' ? props.defaults : undefined
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE)
  const router = useRouter()

  const [date, setDate] = useState(liturgy ? formatISODate(liturgy.date) : (defaults?.date ?? ''))
  const [theme, setTheme] = useState(liturgy?.theme ?? defaults?.theme ?? '')
  const [time, setTime] = useState(liturgy?.time ?? defaults?.time ?? '')
  const [acts, setActs] = useState<ActDraft[]>(() =>
    liturgy ? fromEditorData(liturgy) : defaults ? fromDefaults(defaults) : [emptyAct()]
  )
  const [openActKey, setOpenActKey] = useState<string | null>(acts[0]?.key ?? null)
  const [openMomentKey, setOpenMomentKey] = useState<string | null>(null)
  const [description, setDescription] = useState(liturgy?.description ?? defaults?.description ?? '')
  const [isGenerating, startGeneration] = useTransition()
  const [attemptedIntent, setAttemptedIntent] = useState<LiturgyStatus | null>(null)
  const lastIntentRef = useRef<LiturgyStatus | undefined>(undefined)
  const isPublished = props.mode === 'edit' && props.liturgy.status === 'published'

  const formError = state.status === 'error' ? state.formError : undefined
  const payload = useMemo(
    () =>
      JSON.stringify({
        ...(liturgy ? { id: liturgy.id } : {}),
        date,
        theme,
        time,
        description,
        acts: acts.map((act) => ({
          ...(act.id ? { id: act.id } : {}),
          name: act.name,
          moments: act.moments.map((moment) => ({
            ...(moment.id ? { id: moment.id } : {}),
            type: moment.type,
            description: moment.description,
            song_id: moment.song_id,
            scripture_passages: moment.scripture_passages,
            sermon_speaker: moment.sermon_speaker,
            sacrament_type: moment.sacrament_type,
          })),
        })),
      }),
    [acts, date, description, liturgy, theme, time]
  )
  const clientErrors = useMemo(() => {
    if (!attemptedIntent) return {}
    const schema = attemptedIntent === 'draft' ? draftLiturgyTreeSchema : liturgyTreeSchema
    const result = schema.safeParse(JSON.parse(payload))
    return result.success ? {} : errorsFromIssues(result.error.issues)
  }, [payload, attemptedIntent])
  const actErrorSummary = useMemo(() => buildLiturgyActErrorSummary(clientErrors, acts), [acts, clientErrors])
  const actIndexesWithErrors = useMemo(() => new Set(actErrorSummary.map((group) => group.actIndex)), [actErrorSummary])

  useEffect(() => {
    if (state.status !== 'success') return
    const message =
      lastIntentRef.current === 'draft'
        ? 'Liturgia salva como rascunho'
        : lastIntentRef.current === 'published'
          ? 'Liturgia publicada'
          : props.mode === 'edit'
            ? 'Liturgia atualizada'
            : 'Liturgia criada'
    toast.success(message)
    router.push('/admin/liturgies')
  }, [state.status, props.mode, router])

  function updateAct(index: number, next: Partial<ActDraft>) {
    setActs((current) => current.map((act, i) => (i === index ? { ...act, ...next } : act)))
  }

  function updateMoment(actIndex: number, momentIndex: number, next: Partial<MomentDraft>) {
    setActs((current) =>
      current.map((act, i) =>
        i === actIndex
          ? { ...act, moments: act.moments.map((moment, j) => (j === momentIndex ? { ...moment, ...next } : moment)) }
          : act
      )
    )
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const intent = submitter?.name === 'status' ? (submitter.value as LiturgyStatus) : undefined
    lastIntentRef.current = intent

    const schema = intent === 'draft' ? draftLiturgyTreeSchema : liturgyTreeSchema
    const result = schema.safeParse(JSON.parse(payload))
    if (result.success) return

    event.preventDefault()
    setAttemptedIntent(intent === 'draft' ? 'draft' : 'published')
  }

  return (
    <div className="grid gap-4">
      <Form action={formAction} onSubmit={submit} className="space-y-6">
        <FormError message={formError} />
        {actErrorSummary.length > 0 ? (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive grid gap-3 rounded-lg border px-4 py-3 text-sm"
          >
            <p className="font-medium">Revise os erros nos Atos:</p>
            {actErrorSummary.map((group) => (
              <div key={group.actIndex}>
                <p className="font-medium">{group.label}</p>
                <ul className="list-disc pl-5">
                  {group.messages.map((message, index) => (
                    <li key={`${message}-${index}`}>{message}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
        <input type="hidden" name="payload" value={payload} />

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField>
            <Label htmlFor="date">Data</Label>
            <Input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <FieldError messages={clientErrors.date} />
          </FormField>
          <FormField>
            <Label htmlFor="time">Horário</Label>
            <Input id="time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            <FieldError messages={clientErrors.time} />
          </FormField>
          <FormField>
            <Label htmlFor="theme">Tipo de Culto</Label>
            <Input id="theme" value={theme} onChange={(event) => setTheme(event.target.value)} />
            <FieldError messages={clientErrors.theme} />
          </FormField>
        </div>

        <section className="grid gap-4">
          <h3 className="text-base font-semibold tracking-normal">Atos</h3>
          <FieldError messages={clientErrors.acts} />

          <Accordion
            value={openActKey ? [openActKey] : []}
            onValueChange={(value) => setOpenActKey((value[0] as string | undefined) ?? null)}
          >
            {acts.map((act, actIndex) => (
              <AccordionItem key={act.key} value={act.key} id={`act-${actIndex}`}>
                <AccordionTrigger>
                  <span>{liturgyActLabel(act, actIndex)}</span>
                  {actIndexesWithErrors.has(actIndex) ? (
                    <>
                      <span aria-hidden="true" className="bg-destructive size-2 shrink-0 rounded-full" />
                      <span className="sr-only">Ato com erro de validação</span>
                    </>
                  ) : null}
                </AccordionTrigger>
                <AccordionContent className="grid gap-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <FormField className="min-w-52 flex-1">
                      <Label htmlFor={`act-${act.key}-name`}>Nome do Ato</Label>
                      <Input
                        id={`act-${act.key}-name`}
                        value={act.name}
                        onChange={(event) => updateAct(actIndex, { name: event.target.value })}
                      />
                      <FieldError messages={clientErrors[`acts.${actIndex}.name`]} />
                    </FormField>
                    <ReorderButtons
                      index={actIndex}
                      length={acts.length}
                      onMove={(direction) => setActs((current) => moveItem(current, actIndex, actIndex + direction))}
                      onRemove={() => removeAct(actIndex)}
                      removeLabel="Remover ato"
                    />
                  </div>

                  <Accordion
                    value={openMomentKey ? [openMomentKey] : []}
                    onValueChange={(value) => setOpenMomentKey((value[0] as string | undefined) ?? null)}
                  >
                    {act.moments.map((moment, momentIndex) => (
                      <MomentFields
                        key={moment.key}
                        actIndex={actIndex}
                        momentIndex={momentIndex}
                        moment={moment}
                        songs={props.songs}
                        errors={clientErrors}
                        onUpdate={(next) => updateMoment(actIndex, momentIndex, next)}
                        onMove={(direction) => moveMoment(actIndex, momentIndex, direction)}
                        length={act.moments.length}
                        onRemove={() => removeMoment(actIndex, momentIndex)}
                        hasError={Object.keys(clientErrors).some((path) =>
                          path.startsWith(`acts.${actIndex}.moments.${momentIndex}.`)
                        )}
                      />
                    ))}
                  </Accordion>

                  <div>
                    <Button type="button" variant="outline" size="sm" onClick={() => addMoment(actIndex)}>
                      <Plus data-icon="inline-start" />
                      Momento
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div>
            <Button type="button" variant="outline" onClick={addAct}>
              <Plus data-icon="inline-start" />
              Ato
            </Button>
          </div>
        </section>

        <FormField>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="description">Descrição</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isGenerating}
              onClick={() =>
                startGeneration(async () => {
                  const generationActs = acts.map((act) => ({
                    ...act,
                    moments: act.moments.map((moment) => ({
                      ...moment,
                      song_title: props.songs.find((song) => song.id === moment.song_id)?.title,
                    })),
                  }))
                  const result = await generateLiturgyDescriptionAction({ mode: props.mode, acts: generationActs })
                  if (result.error) toast.error(result.error)
                  else if (result.description) setDescription(result.description)
                })
              }
            >
              {isGenerating ? 'Gerando…' : 'Gerar descrição'}
            </Button>
          </div>
          <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
        </FormField>

        <FormActions>
          <Link href="/admin/liturgies" className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancelar
          </Link>
          {!isPublished ? (
            <Button type="submit" name="status" value="draft" variant="outline" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar como rascunho'}
            </Button>
          ) : null}
          <Button type="submit" {...(!isPublished ? { name: 'status', value: 'published' } : {})} disabled={isPending}>
            {isPending ? 'Salvando...' : isPublished ? 'Salvar' : 'Publicar'}
          </Button>
        </FormActions>
      </Form>
      {isPublished && props.mode === 'edit' ? (
        <div className="flex justify-end">
          <UnpublishLiturgyButton liturgyId={props.liturgy.id} theme={props.liturgy.theme} />
        </div>
      ) : null}
    </div>
  )

  function addMoment(actIndex: number) {
    const moment = emptyMoment()
    updateAct(actIndex, { moments: [...acts[actIndex].moments, moment] })
    setOpenMomentKey(moment.key)
  }

  function moveMoment(actIndex: number, momentIndex: number, direction: -1 | 1) {
    updateAct(actIndex, {
      moments: moveItem(acts[actIndex].moments, momentIndex, momentIndex + direction),
    })
  }

  function removeAct(actIndex: number) {
    const act = acts[actIndex]
    if (actHasContent(act) && !window.confirm('Remover este Ato e seus Momentos?')) return
    if (act.key === openActKey) {
      setOpenActKey(acts[actIndex - 1]?.key ?? acts.find((_, index) => index !== actIndex)?.key ?? null)
    }
    if (act.moments.some((moment) => moment.key === openMomentKey)) setOpenMomentKey(null)
    setActs((current) => current.filter((_, i) => i !== actIndex))
  }

  function removeMoment(actIndex: number, momentIndex: number) {
    const moment = acts[actIndex].moments[momentIndex]
    if (momentHasContent(moment) && !window.confirm('Remover este Momento?')) return
    if (moment.key === openMomentKey) setOpenMomentKey(acts[actIndex].moments[momentIndex - 1]?.key ?? null)
    updateAct(actIndex, { moments: acts[actIndex].moments.filter((_, i) => i !== momentIndex) })
  }

  function addAct() {
    const act = emptyAct()
    setActs((current) => [...current, act])
    setOpenActKey(act.key)
  }
}

function UnpublishLiturgyButton({ liturgyId, theme }: { liturgyId: number; theme: string }) {
  const [state, formAction, isPending] = useActionState(unpublishLiturgyFormAction, INITIAL_STATE)
  const router = useRouter()
  const payload = useMemo(() => JSON.stringify({ id: liturgyId }), [liturgyId])

  const formError = state.status === 'error' ? state.formError : undefined

  useEffect(() => {
    if (state.status !== 'success') return
    toast.success('Liturgia voltou a rascunho')
    router.refresh()
  }, [state.status, router])

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <RotateCcw data-icon="inline-start" />
        Voltar para rascunho
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Voltar para rascunho</DialogTitle>
          <DialogDescription>Tem certeza que deseja voltar «{theme}» para rascunho?</DialogDescription>
        </DialogHeader>
        <FormError message={formError} />
        <form action={formAction}>
          <input type="hidden" name="payload" value={payload} />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancelar</DialogClose>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? 'Voltando...' : 'Voltar para rascunho'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MomentFields({
  actIndex,
  momentIndex,
  moment,
  songs,
  errors,
  onUpdate,
  onMove,
  length,
  onRemove,
  hasError,
}: {
  actIndex: number
  momentIndex: number
  moment: MomentDraft
  songs: SongPickerOption[]
  errors: FormErrors
  onUpdate: (next: Partial<MomentDraft>) => void
  onMove: (direction: -1 | 1) => void
  length: number
  onRemove: () => void
  hasError: boolean
}) {
  const base = `acts.${actIndex}.moments.${momentIndex}`
  const descriptionField = (
    <FormField>
      <Label>{moment.type === 'sermon' ? 'Tema do Sermão' : 'Descrição'}</Label>
      <Textarea
        rows={1}
        className="min-h-0"
        value={moment.description}
        onChange={(event) => onUpdate({ description: event.target.value })}
      />
      <FieldError messages={errors[`${base}.description`]} />
    </FormField>
  )

  return (
    <AccordionItem value={moment.key} id={`moment-${actIndex}-${momentIndex}`}>
      <AccordionTrigger>
        <span>
          Momento {momentIndex + 1} — {MOMENT_TYPE_LABELS[moment.type]}
        </span>
        {hasError ? (
          <>
            <span aria-hidden="true" className="bg-destructive size-2 shrink-0 rounded-full" />
            <span className="sr-only">Momento com erro de validação</span>
          </>
        ) : null}
      </AccordionTrigger>
      <AccordionContent className="grid gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <FormField className="min-w-48 flex-1">
            <Label>Tipo de Momento</Label>
            <Select value={moment.type} onValueChange={(value) => onUpdate({ type: value as MomentType })}>
              <SelectTrigger className="w-full">
                <SelectValue>{(value) => MOMENT_TYPE_LABELS[value as MomentType]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MOMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {MOMENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <ReorderButtons
            index={momentIndex}
            length={length}
            onMove={onMove}
            onRemove={onRemove}
            removeLabel="Remover momento"
          />
        </div>

        {moment.type === 'sermon' ? descriptionField : null}

        {moment.type === 'song' ? (
          <SongCombobox
            songs={songs}
            value={moment.song_id}
            onChange={(song_id) => onUpdate({ song_id })}
            error={errors[`${base}.song_id`]}
          />
        ) : null}

        {moment.type === 'sermon' ? (
          <FormField>
            <Label>Pregador</Label>
            <Input
              value={moment.sermon_speaker}
              onChange={(event) => onUpdate({ sermon_speaker: event.target.value })}
            />
          </FormField>
        ) : null}

        {moment.type === 'sacrament' ? (
          <FormField>
            <Label>Tipo de sacramento</Label>
            <Select
              value={moment.sacrament_type ?? ''}
              onValueChange={(value) => onUpdate({ sacrament_type: value as SacramentType })}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{(value) => SACRAMENT_TYPE_LABELS[value as SacramentType]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SACRAMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={errors[`${base}.sacrament_type`]} />
          </FormField>
        ) : null}

        {moment.type === 'bible_reading' || moment.type === 'sermon' ? (
          <PassagesEditor
            passages={moment.scripture_passages}
            errors={errors}
            base={base}
            onChange={(scripture_passages) => onUpdate({ scripture_passages })}
          />
        ) : null}
        {moment.type !== 'sermon' ? descriptionField : null}
      </AccordionContent>
    </AccordionItem>
  )
}

function SongCombobox({
  songs,
  value,
  onChange,
  error,
}: {
  songs: SongPickerOption[]
  value: number | null
  onChange: (id: number | null) => void
  error?: string[]
}) {
  const selected = songs.find((song) => song.id === value)
  const [query, setQuery] = useState(selected?.title ?? '')
  const visible = songs.filter((song) => song.title.toLowerCase().includes(query.toLowerCase())).slice(0, 8)

  return (
    <FormField>
      <Label>Cântico</Label>
      <Input
        role="combobox"
        aria-expanded={visible.length > 0}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          if (value && selected?.title !== event.target.value) onChange(null)
        }}
      />
      {query ? (
        <div className="grid gap-1 rounded-lg border p-1">
          {visible.map((song) => (
            <button
              key={song.id}
              type="button"
              className="hover:bg-accent rounded-md px-2 py-1 text-left text-sm"
              onClick={() => {
                onChange(song.id)
                setQuery(song.title)
              }}
            >
              {song.title}
              {song.songReference ? (
                <span className="text-muted-foreground block text-xs">{song.songReference}</span>
              ) : null}
            </button>
          ))}
          {visible.length === 0 ? (
            <p className="text-muted-foreground px-2 py-1 text-sm">Nenhum cântico encontrado.</p>
          ) : null}
        </div>
      ) : null}
      {value ? (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onChange(null)
              setQuery('')
            }}
          >
            Limpar cântico
          </Button>
        </div>
      ) : null}
      <FieldError messages={error} />
    </FormField>
  )
}

function PassagesEditor({
  passages,
  errors,
  base,
  onChange,
}: {
  passages: PassageDraft[]
  errors: FormErrors
  base: string
  onChange: (passages: PassageDraft[]) => void
}) {
  function update(index: number, next: Partial<PassageDraft>) {
    onChange(passages.map((passage, i) => (i === index ? { ...passage, ...next } : passage)))
  }

  return (
    <FormField>
      <div className="flex items-center justify-between gap-3">
        <Label>Passagens</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...passages, emptyPassage()])}>
          <Plus data-icon="inline-start" />
          Passagem
        </Button>
      </div>
      <FieldError messages={errors[`${base}.scripture_passages`]} />

      <div className="grid gap-2">
        {passages.map((passage, index) => (
          <div key={index} className="grid gap-2 rounded-lg border p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
              <Input
                placeholder="Referência"
                value={passage.reference}
                onChange={(event) => update(index, { reference: event.target.value })}
              />
              <Input
                placeholder="Versão"
                value={passage.version}
                onChange={(event) => update(index, { version: event.target.value })}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                aria-label="Remover passagem"
                onClick={() => onChange(passages.filter((_, i) => i !== index))}
              >
                <Trash2 />
              </Button>
            </div>
            <Textarea
              placeholder="Texto"
              value={passage.text}
              onChange={(event) => update(index, { text: event.target.value })}
            />
            <FieldError messages={errors[`${base}.scripture_passages.${index}.reference`]} />
            <FieldError messages={errors[`${base}.scripture_passages.${index}.version`]} />
            <FieldError messages={errors[`${base}.scripture_passages.${index}.text`]} />
          </div>
        ))}
      </div>
    </FormField>
  )
}

function ReorderButtons({
  index,
  length,
  onMove,
  onRemove,
  removeLabel,
}: {
  index: number
  length: number
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
  removeLabel: string
}) {
  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Mover para cima"
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Mover para baixo"
        disabled={index === length - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown />
      </Button>
      <Button type="button" variant="destructive" size="icon-sm" aria-label={removeLabel} onClick={onRemove}>
        <Trash2 />
      </Button>
    </div>
  )
}

function fromEditorData(liturgy: LiturgyEditorData): ActDraft[] {
  return liturgy.acts.map((act) => ({
    key: key(),
    id: act.id,
    name: act.name,
    moments: act.moments.map((moment) => ({
      key: key(),
      id: moment.id,
      type: moment.type,
      description: moment.description ?? '',
      song_id: moment.song_id,
      scripture_passages: (moment.scripture_passages ?? []).map((passage) => ({
        reference: passage.reference ?? '',
        text: passage.text ?? '',
        version: passage.version ?? '',
      })),
      sermon_speaker: moment.sermon_speaker ?? '',
      sacrament_type: moment.sacrament_type,
    })),
  }))
}

function fromDefaults(defaults: LiturgyFormDefaults): ActDraft[] {
  return defaults.acts.map((act) => ({
    key: key(),
    name: act.name,
    moments: act.moments.map((moment) => ({
      key: key(),
      type: moment.type,
      description: moment.description,
      song_id: moment.song_id,
      scripture_passages: moment.scripture_passages,
      sermon_speaker: moment.sermon_speaker,
      sacrament_type: moment.sacrament_type,
    })),
  }))
}

function emptyAct(): ActDraft {
  return { key: key(), name: '', moments: [] }
}

function emptyMoment(): MomentDraft {
  return {
    key: key(),
    type: 'prayer',
    description: '',
    song_id: null,
    scripture_passages: [],
    sermon_speaker: '',
    sacrament_type: null,
  }
}

function emptyPassage(): PassageDraft {
  return { reference: '', text: '', version: '' }
}

function key(): string {
  return globalThis.crypto?.randomUUID?.() ?? String(Math.random())
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function errorsFromIssues(issues: Array<{ path: PropertyKey[]; message: string }>): FormErrors {
  const errors: FormErrors = {}
  for (const issue of issues) {
    const path = issue.path.join('.')
    errors[path] = [...(errors[path] ?? []), issue.message]
  }
  return errors
}

function actHasContent(act: ActDraft): boolean {
  return act.name.trim().length > 0 || act.moments.length > 0
}

function momentHasContent(moment: MomentDraft): boolean {
  return (
    moment.description.trim().length > 0 ||
    Boolean(moment.song_id) ||
    moment.scripture_passages.length > 0 ||
    moment.sermon_speaker.trim().length > 0 ||
    Boolean(moment.sacrament_type)
  )
}
