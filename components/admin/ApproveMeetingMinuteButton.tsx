'use client'

import { Check } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { approveMeetingMinuteFormAction } from '@/app/(admin)/admin/meeting-minutes/form-actions'
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
import { FormError } from './FormFeedback'

type Props = {
  minute: { id: number; number: number; title: string }
}

export function ApproveMeetingMinuteButton({ minute }: Props) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [isPending, startTransition] = useTransition()

  function approve() {
    startTransition(async () => {
      const state = await approveMeetingMinuteFormAction(minute.id)

      if (state.status === 'error') {
        setFormError(state.formError)
        return
      }

      setOpen(false)
      // A consolidated Ata whose document failed is still consolidated: the operator is told
      // what is missing, not that the Aprovação went wrong.
      if (state.status === 'success' && state.warning) toast.warning(state.warning)
      else toast.success('Ata aprovada')
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Check data-icon="inline-start" />
        Aprovar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aprovar Ata</DialogTitle>
          <DialogDescription>
            Aprovar a {minute.number}ª Ata, “{minute.title}”? Esta ação é irreversível: depois de aprovada, a Ata não
            pode ser editada, ter o Número corrigido nem voltar a Aprovação pendente.
          </DialogDescription>
        </DialogHeader>
        <FormError message={formError} />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>Cancelar</DialogClose>
          <Button type="button" disabled={isPending} onClick={approve}>
            {isPending ? 'Aprovando...' : 'Aprovar definitivamente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
