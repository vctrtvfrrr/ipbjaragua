'use client'

import { Trash2 } from 'lucide-react'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { deleteBulletinFormAction } from '@/app/(admin)/admin/bulletins/form-actions'
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

export function DeleteBulletinButton({ bulletin }: { bulletin: { id: number; title: string; edition: number } }) {
  const [state, formAction, isPending] = useActionState(deleteBulletinFormAction, INITIAL_STATE)
  const formError = state.status === 'error' ? state.formError : undefined

  useEffect(() => {
    if (state.status === 'success') toast.success('Boletim excluído')
  }, [state.status])

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 data-icon="inline-start" />
        Excluir
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir boletim</DialogTitle>
          <DialogDescription>
            Esta exclusão é irreversível. Tem certeza que deseja excluir a edição {bulletin.edition} — {bulletin.title}?
          </DialogDescription>
        </DialogHeader>
        <FormError message={formError} />
        <form action={formAction}>
          <input type="hidden" name="id" value={bulletin.id} />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancelar</DialogClose>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? 'Excluindo...' : 'Excluir definitivamente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
