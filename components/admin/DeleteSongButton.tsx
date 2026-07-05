'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { deleteSongFormAction } from '@/app/(admin)/admin/songs/form-actions'
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

export function DeleteSongButton({ song }: { song: { id: number; title: string } }) {
  const [state, formAction, isPending] = useActionState(deleteSongFormAction, INITIAL_STATE)
  const router = useRouter()

  const formError = state.status === 'error' ? state.formError : undefined

  useEffect(() => {
    if (state.status !== 'success') return
    toast.success('Música excluída')
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
          <DialogTitle>Excluir música</DialogTitle>
          <DialogDescription>Tem certeza que deseja excluir «{song.title}»?</DialogDescription>
        </DialogHeader>
        <FormError message={formError} />
        <form action={formAction}>
          <input type="hidden" name="id" value={song.id} />
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
