export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

export function resolvePage(raw: string | string[] | undefined, totalPages: number): number {
  if (typeof raw !== 'string') return 1

  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1) return 1

  return Math.min(parsed, totalPages)
}
