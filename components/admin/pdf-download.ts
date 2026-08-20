export type PdfPhase = 'idle' | 'waiting' | 'generating'

const STATE_INTERVAL_MS = 700

// The queue is on the server, so the control can only report the phase by asking: it starts at
// Aguardando the moment it is clicked and turns to Gerando when its render reaches the front.
export function watchPdfJobState(stateUrl: string, setPhase: (phase: PdfPhase) => void): () => void {
  const timer = setInterval(async () => {
    try {
      const response = await fetch(stateUrl)
      if (!response.ok) return

      const { state } = (await response.json()) as { state: PdfPhase }
      if (state === 'generating') setPhase(state)
    } catch {
      // A missed poll only costs the label its precision; the generation is unaffected.
    }
  }, STATE_INTERVAL_MS)

  return () => clearInterval(timer)
}

export async function pdfFailureMessage(response: Response, fallback: string): Promise<string> {
  try {
    const { message } = (await response.json()) as { message?: string }
    return message ?? fallback
  } catch {
    return fallback
  }
}

// The server names the document; the browser only writes the name down.
export function pdfFilename(response: Response, fallback: string): string {
  const disposition = response.headers.get('Content-Disposition') ?? ''

  return /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallback
}

// The document leaves the browser under the name the server gave it: a blob handed to a viewer
// would be saved under whatever name that viewer invents.
export function savePdf(pdf: Blob, filename: string): void {
  const url = URL.createObjectURL(pdf)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  // Revoking now would pull the document out from under a download that has not started.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
