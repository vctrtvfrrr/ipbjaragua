'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createArticle, updateArticle } from '@/app/(admin)/admin/articles/form-actions'
import { Button } from '@/components/ui/button'
import { Form, FormActions, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Article } from '@/db/queries/articles'
import { formatISODate, todayISO } from '@/lib/date'
import type { ActionState } from '@/lib/entity-action'
import { MarkdownField } from './MarkdownField'
import { FieldError, FormError } from './FormFeedback'
import { SlugField } from './SlugField'

const INITIAL_STATE: ActionState = { status: 'idle' }

type Props = { mode: 'create' } | { mode: 'edit'; article: Article }

export function ArticleForm(props: Props) {
  const article = props.mode === 'edit' ? props.article : undefined
  const action = props.mode === 'edit' ? updateArticle : createArticle

  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE)
  const [title, setTitle] = useState(article?.title ?? '')
  const router = useRouter()

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const formError = state.status === 'error' ? state.formError : undefined

  useEffect(() => {
    if (state.status !== 'success') return
    toast.success(props.mode === 'edit' ? 'Artigo atualizado' : 'Artigo criado')
    router.push('/admin/articles')
  }, [state.status, props.mode, router])

  return (
    <Form action={formAction}>
      <FormError message={formError} />

      {props.mode === 'edit' ? (
        <>
          <input type="hidden" name="id" value={props.article.id} />
          <input type="hidden" name="oldSlug" value={props.article.slug} />
        </>
      ) : null}

      <FormField>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          defaultValue={article?.title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <FieldError messages={fieldErrors?.title} />
      </FormField>

      <SlugField mode={props.mode} title={title} defaultValue={article?.slug} errors={fieldErrors?.slug} />

      <FormField>
        <Label htmlFor="author">Autor</Label>
        <Input id="author" name="author" defaultValue={article?.author ?? ''} />
        <FieldError messages={fieldErrors?.author} />
      </FormField>

      <FormField>
        <Label htmlFor="date">Data</Label>
        <Input id="date" name="date" type="date" defaultValue={article ? formatISODate(article.date) : todayISO()} />
        <FieldError messages={fieldErrors?.date} />
      </FormField>

      <FormField>
        <Label htmlFor="excerpt">Resumo</Label>
        <Textarea id="excerpt" name="excerpt" defaultValue={article?.excerpt ?? ''} />
        <FieldError messages={fieldErrors?.excerpt} />
      </FormField>

      <MarkdownField defaultValue={article?.content} errors={fieldErrors?.content} />

      <FormActions>
        <Button variant="outline" render={<Link href="/admin/articles" />}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </FormActions>
    </Form>
  )
}
