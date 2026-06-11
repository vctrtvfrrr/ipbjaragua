export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

// Turns a raw ?page= search param into a valid 1-based page within
// [1, totalPages]. Anything malformed (missing, non-integer, repeated)
// falls back to page 1; out-of-range values clamp to the nearest bound.
export function resolvePage(raw: string | string[] | undefined, totalPages: number): number {
  if (typeof raw !== 'string') return 1

  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1) return 1

  return Math.min(parsed, totalPages)
}
