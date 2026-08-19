'use client'

import { FileText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type Phase = 'idle' | 'waiting' | 'generating'

const LABELS: Record<Phase, string> = {
  idle: 'Visualizar PDF',
  waiting: 'Aguardando…',
  generating: 'Gerando…',
}

const GENERIC_ERROR = 'Não foi possível gerar o PDF da Ata. Tente novamente.'
const STATE_INTERVAL_MS = 700

type Props = {
  minute: { id: number; number: number }
}

export function MeetingMinutePdfButton({ minute }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const base = `/admin/meeting-minutes/${minute.id}/pdf`

  async function view() {
    // The tab has to be claimed inside the click, before any await: opened later, it is a
    // popup the browser blocks.
    const viewer = window.open('', '_blank')
    setPhase('waiting')
    const stopWatching = watchState(base, setPhase)

    try {
      const response = await fetch(base)
      if (!response.ok) throw new Error(await failureMessage(response))

      present(viewer, await response.blob(), `ata-${minute.number}.pdf`)
    } catch (error) {
      viewer?.close()
      toast.error(error instanceof Error ? error.message : GENERIC_ERROR)
    } finally {
      stopWatching()
      setPhase('idle')
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={phase !== 'idle'} onClick={view}>
      <FileText data-icon="inline-start" />
      {LABELS[phase]}
    </Button>
  )
}

function watchState(base: string, setPhase: (phase: Phase) => void): () => void {
  const timer = setInterval(async () => {
    try {
      const response = await fetch(`${base}/state`)
      if (!response.ok) return

      const { state } = (await response.json()) as { state: Phase }
      if (state === 'generating') setPhase(state)
    } catch {
      // A missed poll only costs the label its precision; the generation is unaffected.
    }
  }, STATE_INTERVAL_MS)

  return () => clearInterval(timer)
}

async function failureMessage(response: Response): Promise<string> {
  try {
    const { message } = (await response.json()) as { message?: string }
    return message ?? GENERIC_ERROR
  } catch {
    return GENERIC_ERROR
  }
}

function present(viewer: Window | null, pdf: Blob, filename: string): void {
  const url = URL.createObjectURL(pdf)

  if (viewer) viewer.location.href = url
  else {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  }

  // Revoking now would pull the document out from under the viewer that is still loading it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
