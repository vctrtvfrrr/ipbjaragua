'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { deleteFeaturedImageAction } from '@/app/(admin)/admin/featured-images/actions'
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

const INITIAL: ActionState = { status: 'idle' }
export function DeleteFeaturedImageButton({ id }: { id: number }) {
  const [state, action, pending] = useActionState(deleteFeaturedImageAction, INITIAL)
  useEffect(() => {
    if (state.status === 'success') toast.success('Imagem excluída')
  }, [state.status])
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>Excluir</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir imagem</DialogTitle>
          <DialogDescription>
            Os Artigos vinculados passarão a usar a imagem padrão. Deseja continuar?
          </DialogDescription>
        </DialogHeader>
        <FormError message={state.status === 'error' ? state.formError : undefined} />
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancelar</DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
