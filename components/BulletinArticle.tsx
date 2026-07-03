'use client'

import { useState } from 'react'
import type { Article } from '@/db/queries/articles'
import Markdown from './Markdown'

export default function BulletinArticle({ article }: { article: Article }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="mb-10">
      <h2 className="font-narrow mb-2 text-2xl text-green-900">{article.title}</h2>
      {article.author ? <p className="mb-3 text-sm text-gray-500">{article.author}</p> : null}

      <div className="relative">
        <div
          className="prose max-w-none overflow-hidden text-justify transition-all duration-500"
          style={{ maxHeight: expanded ? '99999px' : '20rem' }}
        >
          <Markdown content={article.content} />
        </div>

        {expanded ? null : (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-28 items-end justify-center bg-linear-to-t from-white via-white/90 to-transparent">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="pointer-events-auto rounded-full bg-green-900 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-green-800"
            >
              Continuar lendo
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
