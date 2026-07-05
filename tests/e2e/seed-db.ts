import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { agenda, announcements, articles, bulletins, liturgies, members, users } from '../../db/schema'
import { parseISODate } from '../../lib/date'

export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? 'postgres://ipbjaragua:ipbjaragua@localhost:5432/ipbjaragua_e2e'

const ADMIN_DATABASE_URL =
  process.env.E2E_ADMIN_DATABASE_URL ?? 'postgres://ipbjaragua:ipbjaragua@localhost:5432/postgres'

const E2E_DB_NAME = 'ipbjaragua_e2e'

export const FEATURED = {
  slug: 'graca-soberana',
  title: 'Graça Soberana',
  author: 'Rev. Jean Carlos Almeida',
  date: '2026-06-07',
  excerpt: 'Um breve resumo do artigo em destaque.',
  content:
    '## Subtítulo\n\nConteúdo do artigo com **negrito** e uma lista:\n\n- primeiro\n- segundo\n\n| Doutrina | Ênfase |\n| --- | --- |\n| Graça | Soberana |\n',
}

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
  time: '09:00',
}

export const E2E_AGENDA = [
  { title: 'Culto Dominical', is_recurring: true, weekday: 0, time: '10:00' },
  { title: 'Reunião de Células', is_recurring: false, event_date: '2026-06-10' },
]

export const E2E_ANNOUNCEMENT = {
  title: 'Retiro de Jovens',
  description: 'Inscrições abertas até sexta.\n\n| Item | Valor |\n| --- | --- |\n| Inscrição | R$ 80 |\n',
  expires_at: '2026-07-14',
}

export const E2E_MEMBER = {
  full_name: 'Ana Ferreira',
  birth_date: '1990-06-10',
  status: 'active' as const,
}

async function ensureE2eDatabase() {
  const admin = postgres(ADMIN_DATABASE_URL, { max: 1 })
  try {
    const rows = await admin`SELECT 1 FROM pg_database WHERE datname = ${E2E_DB_NAME}`
    if (rows.length === 0) {
      await admin.unsafe(`CREATE DATABASE "${E2E_DB_NAME}"`)
    }
  } finally {
    await admin.end()
  }
}

export async function seedE2eDatabase() {
  await ensureE2eDatabase()

  const client = postgres(E2E_DATABASE_URL, { max: 1 })
  await client.unsafe('DROP SCHEMA public CASCADE')
  await client.unsafe('DROP SCHEMA IF EXISTS drizzle CASCADE')
  await client.unsafe('CREATE SCHEMA public')

  const db = drizzle(client, { schema: { articles, bulletins, liturgies, agenda, announcements, members, users } })
  await migrate(db, { migrationsFolder: './db/migrations' })

  const authorIds = new Map<string, number>()
  const authorNames = [...new Set(E2E_ARTICLES.map((article) => article.author))]
  for (const [index, name] of authorNames.entries()) {
    const [user] = await db
      .insert(users)
      .values({ email: `autor-${index + 1}@example.com`, name, status: 'active' })
      .returning({ id: users.id })
    authorIds.set(name, user.id)
  }

  let featuredArticleId: number | undefined
  for (const { author, ...article } of E2E_ARTICLES) {
    const [inserted] = await db
      .insert(articles)
      .values({ ...article, author_id: authorIds.get(author)!, date: parseISODate(article.date) })
      .returning({ id: articles.id })
    if (article.slug === FEATURED.slug) {
      featuredArticleId = inserted.id
    }
  }

  await db.insert(liturgies).values({ ...E2E_LITURGY, date: parseISODate(E2E_LITURGY.date) })

  const bulletinRows = [
    {
      date: '2026-06-07',
      edition: 70,
      title: 'Boletim 07 de junho de 2026',
      article_id: featuredArticleId ?? null,
      show_announcements: true,
      show_agenda: true,
      show_birthdays: true,
    },
    {
      date: '2026-05-31',
      edition: 69,
      title: 'Boletim 31 de maio de 2026',
      article_id: null,
      show_announcements: false,
      show_agenda: false,
      show_birthdays: false,
    },
    {
      date: '2026-05-24',
      edition: 68,
      title: 'Boletim 24 de maio de 2026',
      article_id: null,
      show_announcements: true,
      show_agenda: true,
      show_birthdays: true,
    },
  ]

  for (const bulletin of bulletinRows) {
    await db.insert(bulletins).values({
      ...bulletin,
      date: parseISODate(bulletin.date),
    })
  }

  for (const item of E2E_AGENDA) {
    await db.insert(agenda).values({
      ...item,
      event_date: 'event_date' in item && item.event_date ? parseISODate(item.event_date) : null,
    })
  }

  await db.insert(announcements).values({ ...E2E_ANNOUNCEMENT, expires_at: parseISODate(E2E_ANNOUNCEMENT.expires_at) })
  await db.insert(members).values({ ...E2E_MEMBER, birth_date: parseISODate(E2E_MEMBER.birth_date) })

  await client.end()
}

export const E2E_BULLETINS_COUNT = 3
