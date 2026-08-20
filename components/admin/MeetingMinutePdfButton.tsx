'use client'

import { FileText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { pdfFailureMessage, savePdf, watchPdfJobState, type PdfPhase } from './pdf-download'

const LABELS: Record<PdfPhase, string> = {
  idle: 'Baixar PDF',
  waiting: 'Aguardando…',
  generating: 'Gerando…',
}

const GENERIC_ERROR = 'Não foi possível gerar o PDF da Ata. Tente novamente.'

type Props = {
  minute: { id: number; number: number }
}

export function MeetingMinutePdfButton({ minute }: Props) {
  const [phase, setPhase] = useState<PdfPhase>('idle')
  const base = `/admin/meeting-minutes/${minute.id}/pdf`

  async function download() {
    setPhase('waiting')
    const stopWatching = watchPdfJobState(`${base}/state`, setPhase)

    try {
      const response = await fetch(base)
      if (!response.ok) throw new Error(await pdfFailureMessage(response, GENERIC_ERROR))

      savePdf(await response.blob(), `ata-${minute.number}.pdf`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : GENERIC_ERROR)
    } finally {
      stopWatching()
      setPhase('idle')
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={phase !== 'idle'} onClick={download}>
      <FileText data-icon="inline-start" />
      {LABELS[phase]}
    </Button>
  )
}
