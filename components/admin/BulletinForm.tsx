'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { createBulletinFormAction, updateBulletinFormAction } from '@/app/(admin)/admin/bulletins/form-actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Form, FormActions, FormField, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Bulletin, BulletinArticleOption } from '@/db/queries/bulletins-write'
import { formatISODate, todayISO } from '@/lib/date'
import type { ActionState } from '@/lib/entity-action'
import { BulletinArticleField } from './BulletinArticleField'
import { FieldError, FormError } from './FormFeedback'

const INITIAL_STATE: ActionState = { status: 'idle' }
const DEFAULT_TITLE = 'Boletim Dominical'

type Props = { articles: BulletinArticleOption[]; canEditDate?: boolean; suggestedEdition?: number } & (
  { mode: 'create' } | { mode: 'edit'; bulletin: Bulletin }
)

export function BulletinForm(props: Props) {
  const bulletin = props.mode === 'edit' ? props.bulletin : undefined
  const action = props.mode === 'edit' ? updateBulletinFormAction : createBulletinFormAction
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE)
  const router = useRouter()

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const formError = state.status === 'error' ? state.formError : undefined
  const dateValue = bulletin ? formatISODate(bulletin.date) : todayISO()

  useEffect(() => {
    if (state.status !== 'success') return
    toast.success(props.mode === 'edit' ? 'Boletim atualizado' : 'Boletim criado')
    router.push('/admin/bulletins')
  }, [state.status, props.mode, router])

  return (
    <Form action={formAction}>
      <FormError message={formError} />

      {props.mode === 'edit' ? (
        <>
          <input type="hidden" name="id" value={props.bulletin.id} />
          <input type="hidden" name="oldDate" value={formatISODate(props.bulletin.date)} />
        </>
      ) : null}

      <FormField>
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" defaultValue={bulletin?.title ?? DEFAULT_TITLE} />
        <FieldError messages={fieldErrors?.title} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField>
          <Label htmlFor="date">Data</Label>
          <Input id="date" name="date" type="date" defaultValue={dateValue} disabled={props.canEditDate === false} />
          {props.canEditDate === false ? <input type="hidden" name="date" value={dateValue} /> : null}
          {props.canEditDate === false ? <FormMessage>Registro fechado para alteração de data.</FormMessage> : null}
          <FieldError messages={fieldErrors?.date} />
        </FormField>

        <FormField>
          <Label htmlFor="edition">Edição</Label>
          <Input
            id="edition"
            name="edition"
            type="number"
            min="1"
            defaultValue={bulletin?.edition ?? props.suggestedEdition ?? 1}
          />
          <FieldError messages={fieldErrors?.edition} />
        </FormField>

        <BulletinArticleField
          articles={props.articles}
          defaultArticleId={bulletin?.article_id}
          errors={fieldErrors?.article_id}
        />
      </div>

      <fieldset className="grid gap-3 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">Seções</legend>
        <CheckboxField name="show_announcements" label="Avisos" defaultChecked={bulletin?.show_announcements ?? true} />
        <CheckboxField name="show_agenda" label="Agenda" defaultChecked={bulletin?.show_agenda ?? true} />
        <CheckboxField
          name="show_birthdays"
          label="Aniversariantes"
          defaultChecked={bulletin?.show_birthdays ?? true}
        />
      </fieldset>

      <FormActions>
        <Link href="/admin/bulletins" className={cn(buttonVariants({ variant: 'outline' }))}>
          Cancelar
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </FormActions>
    </Form>
  )
}

function CheckboxField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="size-4" />
      {label}
    </label>
  )
}
