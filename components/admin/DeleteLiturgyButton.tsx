'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { deleteLiturgyFormAction } from '@/app/(admin)/admin/liturgies/form-actions'
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

export function DeleteLiturgyButton({ liturgy }: { liturgy: { id: number; theme: string } }) {
  const [state, formAction, isPending] = useActionState(deleteLiturgyFormAction, INITIAL_STATE)
  const router = useRouter()
  const payload = useMemo(() => JSON.stringify({ id: liturgy.id }), [liturgy.id])

  const formError = state.status === 'error' ? state.formError : undefined

  useEffect(() => {
    if (state.status !== 'success') return
    toast.success('Liturgia excluída')
    router.refresh()
  }, [state.status, router])

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 data-icon="inline-start" />
        Excluir
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Liturgia</DialogTitle>
          <DialogDescription>Tem certeza que deseja excluir «{liturgy.theme}»?</DialogDescription>
        </DialogHeader>
        <FormError message={formError} />
        <form action={formAction}>
          <input type="hidden" name="payload" value={payload} />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancelar</DialogClose>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
