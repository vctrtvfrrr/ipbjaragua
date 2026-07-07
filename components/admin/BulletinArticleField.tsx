'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { BulletinArticleOption } from '@/db/queries/bulletins-write'
import { FieldError } from './FormFeedback'

type Props = {
  articles: BulletinArticleOption[]
  defaultArticleId?: number | null
  errors?: string[]
}

export function BulletinArticleField({ articles, defaultArticleId, errors }: Props) {
  const items = Object.fromEntries([
    ['', 'Nenhum'],
    ...articles.map((article) => [String(article.id), articleLabel(article)]),
  ])

  return (
    <div className="group/field grid gap-2">
      <Label htmlFor="article_id">Artigo</Label>
      <Select name="article_id" defaultValue={defaultArticleId ? String(defaultArticleId) : ''} items={items}>
        <SelectTrigger id="article_id" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Nenhum</SelectItem>
          {articles.map((article) => (
            <SelectItem key={article.id} value={String(article.id)}>
              {articleLabel(article)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError messages={errors} />
    </div>
  )
}

function articleLabel(article: BulletinArticleOption): string {
  return article.authorName ? `${article.title} (${article.authorName})` : article.title
}
