'use client'

import { Trash2 } from 'lucide-react'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { deleteArticle } from '@/app/(admin)/admin/articles/form-actions'
import { Button } from '@/components/ui/button'
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
import type { ActionState } from '@/lib/entity-action'
import { FormError } from './FormFeedback'

const INITIAL_STATE: ActionState = { status: 'idle' }

export function DeleteArticleButton({ article }: { article: { id: number; title: string } }) {
  const [state, formAction, isPending] = useActionState(deleteArticle, INITIAL_STATE)

  const formError = state.status === 'error' ? state.formError : undefined

  useEffect(() => {
    if (state.status === 'success') toast.success('Artigo excluído')
  }, [state.status])

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 data-icon="inline-start" />
        Excluir
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir artigo</DialogTitle>
          <DialogDescription>Tem certeza que deseja excluir «{article.title}»?</DialogDescription>
        </DialogHeader>
        <FormError message={formError} />
        <form action={formAction}>
          <input type="hidden" name="id" value={article.id} />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancelar</DialogClose>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
