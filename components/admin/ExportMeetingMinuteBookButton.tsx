'use client'

import { BookOpen } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { meetingMinuteBookSummaryFormAction } from '@/app/(admin)/admin/meeting-minutes/form-actions'
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
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  meetingMinuteBookPeriodLabel,
  MEETING_MINUTE_BOOK_EMPTY,
  MEETING_MINUTE_BOOK_FAILURE,
  MEETING_MINUTE_BOOK_INVALID,
  MEETING_MINUTE_BOOK_ORDER_LABELS,
  MEETING_MINUTE_BOOK_ORDERS,
  type MeetingMinuteBookInput,
  type MeetingMinuteBookSummary,
} from '@/lib/meeting-minute-book'
import { FormError } from './FormFeedback'
import { pdfFailureMessage, pdfFilename, savePdf, watchPdfJobState, type PdfPhase } from './pdf-download'

const CONFIRM_LABELS: Record<PdfPhase, string> = {
  idle: 'Exportar Livro',
  waiting: 'Aguardando…',
  generating: 'Gerando…',
}

type Props = {
  year: number
}

export function ExportMeetingMinuteBookButton({ year }: Props) {
  const [open, setOpen] = useState(false)
  const [period, setPeriod] = useState<MeetingMinuteBookInput>({
    from: `${year}-01-01`,
    to: `${year}-12-31`,
    order: 'chronological',
  })
  const [summary, setSummary] = useState<MeetingMinuteBookSummary | null>(null)
  const [formError, setFormError] = useState<string>()
  const [phase, setPhase] = useState<PdfPhase>('idle')
  const lastAsked = useRef(0)

  // The count is what the operator confirms, so a slower answer may never overwrite a newer
  // one: an export confirmed against a stale period would not be the one on screen.
  async function refresh(asked: MeetingMinuteBookInput) {
    const token = ++lastAsked.current
    const result = await meetingMinuteBookSummaryFormAction(asked)
    if (token !== lastAsked.current) return

    setSummary(result.status === 'ok' ? result.summary : null)
    setFormError(result.status === 'invalid' ? MEETING_MINUTE_BOOK_INVALID : undefined)
  }

  function change(next: Partial<MeetingMinuteBookInput>) {
    const updated = { ...period, ...next }
    setPeriod(updated)
    void refresh(updated)
  }

  function toggle(next: boolean) {
    setOpen(next)
    if (next) void refresh(period)
  }

  async function exportBook() {
    setPhase('waiting')
    setFormError(undefined)
    const query = new URLSearchParams(period)
    const stopWatching = watchPdfJobState('/admin/meeting-minutes/book/state', setPhase)

    try {
      const response = await fetch(`/admin/meeting-minutes/book?${query}`)
      if (!response.ok) throw new Error(await pdfFailureMessage(response, MEETING_MINUTE_BOOK_FAILURE))

      savePdf(await response.blob(), pdfFilename(response, 'livro-de-atas.pdf'))
      setOpen(false)
      toast.success('Livro de Atas exportado')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : MEETING_MINUTE_BOOK_FAILURE)
    } finally {
      stopWatching()
      setPhase('idle')
    }
  }

  return (
    <Dialog open={open} onOpenChange={toggle}>
      <DialogTrigger render={<Button variant="outline" />}>
        <BookOpen data-icon="inline-start" />
        Exportar Livro de Atas
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Livro de Atas</DialogTitle>
          <DialogDescription>
            O Livro reúne num único PDF a capa e as Atas Aprovadas cuja Data está no período, na ordem escolhida.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField>
            <Label htmlFor="book-from">Início do período</Label>
            <Input
              id="book-from"
              type="date"
              value={period.from}
              onChange={(event) => change({ from: event.target.value })}
            />
          </FormField>
          <FormField>
            <Label htmlFor="book-to">Fim do período</Label>
            <Input
              id="book-to"
              type="date"
              value={period.to}
              onChange={(event) => change({ to: event.target.value })}
            />
          </FormField>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Ordenação</legend>
          {MEETING_MINUTE_BOOK_ORDERS.map((option) => (
            <Label key={option} className="font-normal">
              <input
                type="radio"
                name="book-order"
                value={option}
                checked={period.order === option}
                onChange={() => change({ order: option })}
              />
              {MEETING_MINUTE_BOOK_ORDER_LABELS[option]}
            </Label>
          ))}
        </fieldset>

        <BookPreview summary={summary} />
        <FormError message={formError} />

        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>Cancelar</DialogClose>
          <Button type="button" disabled={phase !== 'idle' || !summary?.count} onClick={exportBook}>
            {CONFIRM_LABELS[phase]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// The operator confirms an expensive operation, so what is confirmed is spelled out: how many
// Atas, which period, which order and which Números — and an empty period says so instead.
function BookPreview({ summary }: { summary: MeetingMinuteBookSummary | null }) {
  if (!summary) return null
  if (summary.count === 0) return <p className="text-muted-foreground text-sm">{MEETING_MINUTE_BOOK_EMPTY}</p>

  return (
    <dl className="text-sm">
      <div className="flex gap-2">
        <dt className="text-muted-foreground">Atas Aprovadas:</dt>
        <dd>{summary.count}</dd>
      </div>
      <div className="flex gap-2">
        <dt className="text-muted-foreground">Período:</dt>
        <dd>{meetingMinuteBookPeriodLabel(summary)}</dd>
      </div>
      <div className="flex gap-2">
        <dt className="text-muted-foreground">Ordenação:</dt>
        <dd>{MEETING_MINUTE_BOOK_ORDER_LABELS[summary.order]}</dd>
      </div>
      <div className="flex gap-2">
        <dt className="text-muted-foreground">Números:</dt>
        <dd>
          {summary.firstNumber} a {summary.lastNumber}
        </dd>
      </div>
    </dl>
  )
}
