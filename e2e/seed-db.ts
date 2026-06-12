import { mkdirSync, rmSync } from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { articles, bulletins, liturgies } from '../db/schema'

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

export const E2E_LITURGY = {
  date: '2026-06-07',
  theme: 'Culto Solene',
}

export function seedE2eDatabase() {
  mkdirSync('./data', { recursive: true })
  rmSync(E2E_DB_PATH, { force: true })

  const sqlite = new Database(E2E_DB_PATH)
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema: { articles, bulletins, liturgies } })
  migrate(db, { migrationsFolder: './db/migrations' })

  // Insert articles and capture the featured article's ID.
  let featuredArticleId: number | undefined
  for (const article of E2E_ARTICLES) {
    const result = db.insert(articles).values(article).run()
    if (article.slug === FEATURED.slug) {
      featuredArticleId = Number(result.lastInsertRowid)
    }
  }

  // Insert liturgy and capture its ID.
  const liturgyResult = db.insert(liturgies).values(E2E_LITURGY).run()
  const liturgyId = Number(liturgyResult.lastInsertRowid)

  // Insert bulletins: the newest one links to the featured article and liturgy.
  const bulletinRows = [
    {
      date: '2026-06-07',
      edition: 70,
      title: 'Boletim 07 de junho de 2026',
      article_id: featuredArticleId ?? null,
      liturgy_id: liturgyId,
      agenda_from: '2026-06-07',
      agenda_to: '2026-06-13',
      birthdays_from: '2026-06-07',
      birthdays_to: '2026-06-13',
      show_announcements: true,
      show_agenda: true,
      show_birthdays: true,
    },
    {
      date: '2026-05-31',
      edition: 69,
      title: 'Boletim 31 de maio de 2026',
      article_id: null,
      liturgy_id: null,
      agenda_from: '2026-05-31',
      agenda_to: '2026-06-06',
      birthdays_from: '2026-05-31',
      birthdays_to: '2026-06-06',
      show_announcements: true,
      show_agenda: true,
      show_birthdays: true,
    },
    {
      date: '2026-05-24',
      edition: 68,
      title: 'Boletim 24 de maio de 2026',
      article_id: null,
      liturgy_id: null,
      agenda_from: '2026-05-24',
      agenda_to: '2026-05-30',
      birthdays_from: '2026-05-24',
      birthdays_to: '2026-05-30',
      show_announcements: true,
      show_agenda: true,
      show_birthdays: true,
    },
  ]

  for (const bulletin of bulletinRows) {
    db.insert(bulletins).values(bulletin).run()
  }

  sqlite.close()
}

export const E2E_BULLETINS_COUNT = 3
