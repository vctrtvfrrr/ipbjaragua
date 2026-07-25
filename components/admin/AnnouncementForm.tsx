'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  createAnnouncementFormAction,
  updateAnnouncementFormAction,
} from '@/app/(admin)/admin/announcements/form-actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Form, FormActions, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Announcement } from '@/db/queries/announcements'
import type { FeaturedImage } from '@/db/queries/featured-images'
import { formatISODate } from '@/lib/date'
import type { ActionState } from '@/lib/entity-action'
import { AnnouncementIconPicker } from './AnnouncementIconPicker'
import { AnnouncementImagePicker } from './AnnouncementImagePicker'
import { FieldError, FormError } from './FormFeedback'
import { MarkdownField } from './MarkdownField'

const INITIAL_STATE: ActionState = { status: 'idle' }

type Props = ({ mode: 'create'; canCreateAgenda: boolean } | { mode: 'edit'; announcement: Announcement }) & {
  images: FeaturedImage[]
}

export function AnnouncementForm(props: Props) {
  const announcement = props.mode === 'edit' ? props.announcement : undefined
  const action = props.mode === 'edit' ? updateAnnouncementFormAction : createAnnouncementFormAction

  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE)
  const router = useRouter()

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const formError = state.status === 'error' ? state.formError : undefined
  const values = state.status === 'error' ? state.values : undefined

  useEffect(() => {
    if (state.status !== 'success') return
    toast.success(props.mode === 'edit' ? 'Aviso atualizado' : 'Aviso criado')
    router.push('/admin/announcements')
  }, [state.status, props.mode, router])

  return (
    <Form action={formAction}>
      <FormError message={formError} />

      {props.mode === 'edit' ? <input type="hidden" name="id" value={props.announcement.id} /> : null}

      <FormField>
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" defaultValue={values?.title ?? announcement?.title} />
        <FieldError messages={fieldErrors?.title} />
      </FormField>

      <MarkdownField
        label="Descrição"
        name="description"
        defaultValue={values?.description ?? announcement?.description}
        errors={fieldErrors?.description}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField>
          <Label htmlFor="url">URL</Label>
          <Input id="url" name="url" type="url" inputMode="url" defaultValue={values?.url ?? announcement?.url ?? ''} />
          <FieldError messages={fieldErrors?.url} />
        </FormField>

        <FormField>
          <Label htmlFor="expires_at">Exibir até</Label>
          <Input
            id="expires_at"
            name="expires_at"
            type="date"
            defaultValue={values?.expires_at ?? (announcement ? formatISODate(announcement.expires_at) : '')}
          />
          <FieldError messages={fieldErrors?.expires_at} />
        </FormField>
      </div>

      <FormField>
        <Label>Ícone</Label>
        <AnnouncementIconPicker defaultValue={announcement?.icon} errors={fieldErrors?.icon} />
      </FormField>

      <FormField>
        <Label>Imagem Destacada</Label>
        <AnnouncementImagePicker
          images={props.images}
          defaultValue={announcement?.featured_image_id}
          errors={fieldErrors?.featured_image_id}
        />
      </FormField>

      {props.mode === 'create' && props.canCreateAgenda ? (
        <label className="flex items-center gap-2 text-sm">
          <input name="add_to_agenda" type="checkbox" className="size-4" />
          Adicionar à Agenda
        </label>
      ) : null}

      <FormActions>
        <Link href="/admin/announcements" className={cn(buttonVariants({ variant: 'outline' }))}>
          Cancelar
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </FormActions>
    </Form>
  )
}
