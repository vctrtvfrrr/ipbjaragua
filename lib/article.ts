const PUBLIC_AUTHOR_FALLBACK = 'Redação'

export function publicAuthorName(article: { authorName: string | null }): string {
  return article.authorName ?? PUBLIC_AUTHOR_FALLBACK
}
