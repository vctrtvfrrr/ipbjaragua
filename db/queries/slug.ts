const DEFAULT_MAX_ATTEMPTS = 100

export type AllocateSlugOptions<T> = {
  baseSlug: string
  occupiedSlugs: Iterable<string>
  tryWrite: (slug: string) => Promise<T>
  createCollisionError: (baseSlug: string) => Error
  maxAttempts?: number
}

export function buildSlugCandidates(baseSlug: string, maxAttempts = DEFAULT_MAX_ATTEMPTS): string[] {
  return Array.from({ length: maxAttempts }, (_, index) => (index === 0 ? baseSlug : `${baseSlug}-${index + 1}`))
}

export function isUniqueViolation(error: unknown): boolean {
  const current = error as { code?: unknown; cause?: unknown } | undefined
  if (current?.code === '23505') return true

  const cause = current?.cause as { code?: unknown } | undefined
  return cause?.code === '23505'
}

export async function writeWithAllocatedSlug<T>({
  baseSlug,
  occupiedSlugs,
  tryWrite,
  createCollisionError,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
}: AllocateSlugOptions<T>): Promise<T> {
  const occupied = new Set(occupiedSlugs)

  for (const candidate of buildSlugCandidates(baseSlug, maxAttempts)) {
    if (occupied.has(candidate)) continue

    try {
      return await tryWrite(candidate)
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
      occupied.add(candidate)
    }
  }

  throw createCollisionError(baseSlug)
}
