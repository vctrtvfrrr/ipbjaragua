import { mkdirSync, rmSync } from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { articles } from '../db/schema'

export const E2E_DB_PATH = './data/e2e.sqlite'

// The most recent article — drives the detail-page test and the home
// featured card. Content carries markdown so rendered output is assertable.
export const FEATURED = {
  slug: 'graca-soberana',
  title: 'Graça Soberana',
  author: 'Rev. Jean Carlos Almeida',
  date: '2026-06-07',
  excerpt: 'Um breve resumo do artigo em destaque.',
  content: '## Subtítulo\n\nConteúdo do artigo com **negrito** e uma lista:\n\n- primeiro\n- segundo\n',
}

// Older articles with descending dates, enough to exercise a second home page
// (12 per page). The featured one is the newest.
const OLDER = Array.from({ length: 14 }, (_, i) => {
  const n = i + 1
  const day = String(28 - i).padStart(2, '0')
  return {
    slug: `artigo-${n}`,
    title: `Artigo ${n}`,
    author: 'Rev. Josiel de Matos',
    date: `2026-05-${day}`,
    excerpt: n % 2 === 0 ? null : `Resumo do artigo ${n}.`,
    content: `Corpo do artigo ${n}.`,
  }
})

export const E2E_ARTICLES = [FEATURED, ...OLDER]

export function seedE2eDatabase() {
  mkdirSync('./data', { recursive: true })
  rmSync(E2E_DB_PATH, { force: true })

  const sqlite = new Database(E2E_DB_PATH)
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema: { articles } })
  migrate(db, { migrationsFolder: './db/migrations' })

  for (const article of E2E_ARTICLES) {
    db.insert(articles).values(article).run()
  }

  sqlite.close()
}
