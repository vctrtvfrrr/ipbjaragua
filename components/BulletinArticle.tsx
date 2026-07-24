'use client'

import { useState } from 'react'
import type { ArticleWithAuthor } from '@/db/queries/articles'
import { publicAuthorName } from '@/lib/article'
import Markdown from './Markdown'

export default function BulletinArticle({ article }: { article: ArticleWithAuthor }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="mb-12 max-w-3xl">
      <p className="eyebrow text-brand-ridge">Artigo</p>
      <h2 className="text-brand-ridge mt-3 font-serif text-3xl leading-snug">{article.title}</h2>
      <p className="text-muted-foreground mt-2 text-sm">{publicAuthorName(article)}</p>

      <div className="relative mt-5">
        <div
          className="prose prose-headings:font-serif prose-headings:text-brand-ridge overflow-hidden transition-all duration-500"
          style={{ maxHeight: expanded ? '99999px' : '20rem' }}
        >
          <Markdown content={article.content} />
        </div>

        {expanded ? null : (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-28 items-end justify-center bg-linear-to-t from-white via-white/90 to-transparent">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/85 pointer-events-auto h-11 px-6 text-sm font-bold"
            >
              Continuar lendo
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
