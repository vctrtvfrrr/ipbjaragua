'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useActionState, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  createMeetingMinuteFormAction,
  updateMeetingMinuteFormAction,
} from '@/app/(admin)/admin/meeting-minutes/form-actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Form, FormActions, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { MeetingMinuteWithTopics } from '@/db/queries/meeting-minutes'
import { formatChurchDateTimeInput } from '@/lib/date'
import type { ActionState } from '@/lib/entity-action'
import { createMeetingMinuteSchema, meetingMinuteTopicLabel, updateMeetingMinuteSchema } from '@/lib/meeting-minute'
import { cn } from '@/lib/utils'
import { FieldError, FormError } from './FormFeedback'
import { MarkdownField } from './MarkdownField'

const INITIAL_STATE: ActionState = { status: 'idle' }

type TopicDraft = { key: string; title: string; discussion: string }
type FormErrors = Record<string, string[]>

type Props = { mode: 'create'; suggestedNumber: number } | { mode: 'edit'; minute: MeetingMinuteWithTopics }

export function MeetingMinuteForm(props: Props) {
  const minute = props.mode === 'edit' ? props.minute : null
  const schema = minute ? updateMeetingMinuteSchema : createMeetingMinuteSchema
  const [state, formAction, isPending] = useActionState(
    minute ? updateMeetingMinuteFormAction : createMeetingMinuteFormAction,
    INITIAL_STATE
  )
  const router = useRouter()

  const [number, setNumber] = useState(() =>
    props.mode === 'edit' ? String(props.minute.number) : String(props.suggestedNumber)
  )
  const [title, setTitle] = useState(() => (props.mode === 'edit' ? props.minute.title : ''))
  const [startedAt, setStartedAt] = useState(() => (minute ? formatChurchDateTimeInput(minute.started_at) : ''))
  const [endedAt, setEndedAt] = useState(() => (minute ? formatChurchDateTimeInput(minute.ended_at) : ''))
  const [location, setLocation] = useState(minute?.location ?? '')
  const [attendees, setAttendees] = useState(minute?.attendees ?? '')
  const [opening, setOpening] = useState(minute?.opening ?? '')
  const [closing, setClosing] = useState(minute?.closing ?? '')
  const [topics, setTopics] = useState<TopicDraft[]>(() =>
    minute
      ? minute.topics.map((topic) => ({ key: randomKey(), title: topic.title, discussion: topic.discussion }))
      : [emptyTopic()]
  )
  const [attempted, setAttempted] = useState(false)

  const formError = state.status === 'error' ? state.formError : undefined
  const payload = useMemo(
    () =>
      JSON.stringify({
        id: minute?.id,
        number,
        title,
        started_at: startedAt,
        ended_at: endedAt,
        location,
        attendees,
        opening,
        closing,
        topics: topics.map((topic) => ({ title: topic.title, discussion: topic.discussion })),
      }),
    [attendees, closing, minute, endedAt, location, number, opening, startedAt, title, topics]
  )
  const errors = useMemo<FormErrors>(() => {
    if (!attempted) return {}
    const result = schema.safeParse(JSON.parse(payload))
    return result.success ? {} : errorsFromIssues(result.error.issues)
  }, [attempted, payload, schema])

  useEffect(() => {
    if (state.status !== 'success') return
    toast.success(minute ? 'Ata atualizada' : 'Ata criada')
    router.push(`/admin/meeting-minutes?year=${startedAt.slice(0, 4)}`)
  }, [state.status, startedAt, router, minute])

  function submit(event: FormEvent<HTMLFormElement>) {
    if (schema.safeParse(JSON.parse(payload)).success) return

    event.preventDefault()
    setAttempted(true)
  }

  function updateTopic(index: number, next: Partial<TopicDraft>) {
    setTopics((current) => current.map((topic, i) => (i === index ? { ...topic, ...next } : topic)))
  }

  function removeTopic(index: number) {
    if (topicHasContent(topics[index]) && !window.confirm('Remover este Tópico?')) return
    setTopics((current) => current.filter((_, i) => i !== index))
  }

  return (
    <Form action={formAction} onSubmit={submit} className="space-y-6">
      <FormError message={formError} />
      <input type="hidden" name="payload" value={payload} />

      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <FormField>
          <Label htmlFor="number">Número</Label>
          <Input id="number" type="number" min="1" value={number} onChange={(event) => setNumber(event.target.value)} />
          <FieldError messages={errors.number} />
        </FormField>

        <FormField>
          <Label htmlFor="title">Título</Label>
          <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <FieldError messages={errors.title} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField>
          <Label htmlFor="started_at">Início da reunião</Label>
          <Input
            id="started_at"
            type="datetime-local"
            value={startedAt}
            onChange={(event) => setStartedAt(event.target.value)}
          />
          <FieldError messages={errors.started_at} />
        </FormField>

        <FormField>
          <Label htmlFor="ended_at">Término da reunião</Label>
          <Input
            id="ended_at"
            type="datetime-local"
            value={endedAt}
            onChange={(event) => setEndedAt(event.target.value)}
          />
          <FieldError messages={errors.ended_at} />
        </FormField>
      </div>

      <FormField>
        <Label htmlFor="location">Local</Label>
        <Input id="location" value={location} onChange={(event) => setLocation(event.target.value)} />
        <FieldError messages={errors.location} />
      </FormField>

      <MarkdownField
        label="Participantes"
        name="attendees"
        defaultValue={minute?.attendees}
        errors={errors.attendees}
        onChange={setAttendees}
      />
      <MarkdownField
        label="Abertura"
        name="opening"
        defaultValue={minute?.opening}
        errors={errors.opening}
        onChange={setOpening}
      />

      <section className="grid gap-4">
        <h3 className="text-base font-semibold tracking-normal">Tópicos</h3>
        <FieldError messages={errors.topics} />

        {topics.map((topic, index) => (
          <fieldset key={topic.key} className="grid gap-4 rounded-lg border p-4">
            <legend className="px-1 text-sm font-medium">{meetingMinuteTopicLabel(topic, index)}</legend>

            <div className="flex flex-wrap items-end gap-3">
              <FormField className="min-w-52 flex-1">
                <Label htmlFor={`topic-${topic.key}-title`}>Título do Tópico</Label>
                <Input
                  id={`topic-${topic.key}-title`}
                  value={topic.title}
                  onChange={(event) => updateTopic(index, { title: event.target.value })}
                />
                <FieldError messages={errors[`topics.${index}.title`]} />
              </FormField>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Mover para cima"
                  disabled={index === 0}
                  onClick={() => setTopics((current) => moveItem(current, index, index - 1))}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Mover para baixo"
                  disabled={index === topics.length - 1}
                  onClick={() => setTopics((current) => moveItem(current, index, index + 1))}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  aria-label="Remover tópico"
                  onClick={() => removeTopic(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>

            <MarkdownField
              label="Discussão"
              name={`topics.${index}.discussion`}
              defaultValue={topic.discussion}
              errors={errors[`topics.${index}.discussion`]}
              onChange={(value) => updateTopic(index, { discussion: value })}
            />
          </fieldset>
        ))}

        <div>
          <Button type="button" variant="outline" onClick={() => setTopics((current) => [...current, emptyTopic()])}>
            <Plus data-icon="inline-start" />
            Tópico
          </Button>
        </div>
      </section>

      <MarkdownField
        label="Encerramento"
        name="closing"
        defaultValue={minute?.closing}
        errors={errors.closing}
        onChange={setClosing}
      />

      <FormActions>
        <Link href="/admin/meeting-minutes" className={cn(buttonVariants({ variant: 'outline' }))}>
          Cancelar
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </FormActions>
    </Form>
  )
}

function emptyTopic(): TopicDraft {
  return { key: randomKey(), title: '', discussion: '' }
}

function randomKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? String(Math.random())
}

function topicHasContent(topic: TopicDraft): boolean {
  return topic.title.trim().length > 0 || topic.discussion.trim().length > 0
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
