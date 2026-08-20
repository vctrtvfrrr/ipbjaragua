'use client'

import { RefreshCw } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { regenerateMeetingMinutePdfFormAction } from '@/app/(admin)/admin/meeting-minutes/form-actions'
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
  minute: { id: number; number: number }
  cached: boolean
}

export function MeetingMinutePdfCacheButton({ minute, cached }: Props) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [isPending, startTransition] = useTransition()
  const label = cached ? 'Regenerar PDF' : 'Gerar PDF'

  function regenerate() {
    startTransition(async () => {
      const state = await regenerateMeetingMinutePdfFormAction(minute.id)

      if (state.status === 'error') {
        setFormError(state.formError)
        return
      }

      setOpen(false)
      toast.success(cached ? 'PDF da Ata substituído' : 'PDF da Ata gerado')
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <RefreshCw data-icon="inline-start" />
        {label}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            {cached
              ? `Substituir o PDF armazenado da ${minute.number}ª Ata? O conteúdo da Ata não muda, e os Livros de Atas gerados a partir de agora usarão a nova versão.`
              : `Gerar e armazenar o PDF da ${minute.number}ª Ata? Os Livros de Atas gerados a partir de agora usarão esta versão.`}
          </DialogDescription>
        </DialogHeader>
        <FormError message={formError} />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>Cancelar</DialogClose>
          <Button type="button" disabled={isPending} onClick={regenerate}>
            {isPending ? 'Gerando...' : label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
