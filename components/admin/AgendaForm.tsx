'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { createAgendaFormAction, updateAgendaFormAction } from '@/app/(admin)/admin/agenda/form-actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Form, FormActions, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AgendaItem } from '@/db/queries/agenda'
import { formatISODate } from '@/lib/date'
import type { ActionState } from '@/lib/entity-action'
import { FieldError, FormError } from './FormFeedback'

const INITIAL_STATE: ActionState = { status: 'idle' }

type AgendaFormDefaults = {
  title?: string
  description?: string | null
  event_date?: Date
  time?: string | null
}

type Props =
  { mode: 'create'; defaults?: AgendaFormDefaults } | { mode: 'edit'; item: AgendaItem; defaults?: AgendaFormDefaults }

export function AgendaForm(props: Props) {
  const item = props.mode === 'edit' ? props.item : undefined
  const action = props.mode === 'edit' ? updateAgendaFormAction : createAgendaFormAction

  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE)
  const router = useRouter()

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const formError = state.status === 'error' ? state.formError : undefined
  const values = state.status === 'error' ? state.values : undefined

  useEffect(() => {
    if (state.status !== 'success') return
    toast.success(props.mode === 'edit' ? 'Evento atualizado' : 'Evento criado')
    router.push('/admin/agenda')
  }, [state.status, props.mode, router])

  const defaults = props.defaults
  const title = values?.title ?? item?.title ?? defaults?.title ?? ''
  const description = values?.description ?? item?.description ?? defaults?.description ?? ''
  const eventDate =
    values?.event_date ??
    (item ? formatISODate(item.event_date) : defaults?.event_date ? formatISODate(defaults.event_date) : '')
  const time = values?.time ?? item?.time?.slice(0, 5) ?? defaults?.time?.slice(0, 5) ?? ''

  return (
    <Form action={formAction}>
      <FormError message={formError} />

      {props.mode === 'edit' ? <input type="hidden" name="id" value={props.item.id} /> : null}

      <FormField>
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" defaultValue={title} />
        <FieldError messages={fieldErrors?.title} />
      </FormField>

      <FormField>
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" defaultValue={description ?? ''} />
        <FieldError messages={fieldErrors?.description} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField>
          <Label htmlFor="event_date">Data</Label>
          <Input id="event_date" name="event_date" type="date" defaultValue={eventDate} />
          <FieldError messages={fieldErrors?.event_date} />
        </FormField>

        <FormField>
          <Label htmlFor="time">Horário</Label>
          <Input id="time" name="time" type="time" defaultValue={time} />
          <FieldError messages={fieldErrors?.time} />
        </FormField>
      </div>

      <FormActions>
        <Link href="/admin/agenda" className={cn(buttonVariants({ variant: 'outline' }))}>
          Cancelar
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </FormActions>
    </Form>
  )
}
