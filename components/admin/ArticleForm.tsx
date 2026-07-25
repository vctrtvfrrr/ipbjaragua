'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createArticleFormAction, updateArticleFormAction } from '@/app/(admin)/admin/articles/form-actions'
import { generateArticleDescriptionAction } from '@/app/(admin)/admin/articles/form-actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Form, FormActions, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Article, AuthorOption } from '@/db/queries/articles'
import { formatISODate, todayISO } from '@/lib/date'
import type { ActionState } from '@/lib/entity-action'
import { AuthorField } from './AuthorField'
import { MarkdownField } from './MarkdownField'
import { FieldError, FormError } from './FormFeedback'
import { SlugField } from './SlugField'

const INITIAL_STATE: ActionState = { status: 'idle' }

type Props = { users: AuthorOption[]; currentUserId: number } & (
  { mode: 'create' } | { mode: 'edit'; article: Article }
)

export function ArticleForm(props: Props) {
  const article = props.mode === 'edit' ? props.article : undefined
  const action = props.mode === 'edit' ? updateArticleFormAction : createArticleFormAction

  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE)
  const [title, setTitle] = useState(article?.title ?? '')
  const [content, setContent] = useState(article?.content ?? '')
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? '')
  const [isGenerating, startGeneration] = useTransition()
  const router = useRouter()

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const formError = state.status === 'error' ? state.formError : undefined
  const values = state.status === 'error' ? state.values : undefined

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
          defaultValue={values?.title ?? article?.title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <FieldError messages={fieldErrors?.title} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <SlugField title={title} defaultValue={article?.slug} errors={fieldErrors?.slug} />

        <AuthorField
          users={props.users}
          defaultUserId={article?.author_id ?? props.currentUserId}
          errors={fieldErrors?.author_id}
        />

        <FormField>
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={values?.date ?? (article ? formatISODate(article.date) : todayISO())}
          />
          <FieldError messages={fieldErrors?.date} />
        </FormField>
      </div>

      <MarkdownField defaultValue={article?.content} errors={fieldErrors?.content} onChange={setContent} />

      <FormField>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="excerpt">Resumo</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isGenerating}
            onClick={() =>
              startGeneration(async () => {
                const result = await generateArticleDescriptionAction({ mode: props.mode, title, content })
                if (result.error) toast.error(result.error)
                else if (result.description) setExcerpt(result.description)
              })
            }
          >
            {isGenerating ? 'Gerando…' : 'Gerar resumo'}
          </Button>
        </div>
        <Textarea id="excerpt" name="excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
        <FieldError messages={fieldErrors?.excerpt} />
      </FormField>

      <FormActions>
        <Link href="/admin/articles" className={cn(buttonVariants({ variant: 'outline' }))}>
          Cancelar
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </FormActions>
    </Form>
  )
}
