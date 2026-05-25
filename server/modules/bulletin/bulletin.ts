import { and, asc, between, desc, gte, lte, sql } from 'drizzle-orm';
import type { DbInstance } from '../../db/client';
import { marked } from 'marked';
import {
  agenda,
  announcements,
  articles,
  liturgies,
  liturgyActs,
  liturgyMoments,
  members,
  songs,
} from '../../db/schema';

type Db = DbInstance;

export type BulletinSections = {
  article?: string;
  weekly_agenda?: string;
  announcements?: string;
  birthdays?: string;
  liturgy?: string;
};

export type BulletinDetail = {
  title: string;
  date: string;
  sections: BulletinSections;
};

const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const MOMENT_TYPE_LABELS: Record<string, string> = {
  bible_reading: 'Leitura Bíblica',
  song: 'Cântico',
  prayer: 'Oração',
  sermon: 'Mensagem',
  sacrament: 'Sacramento',
  pastoral_act: 'Ato Pastoral',
  other: 'Momento',
};

function promoteHeadings(html: string): string {
  return html.replace(/<(\/?)h([3-6])(\s|>)/g, (_, slash: string, level: string, suffix: string) => {
    return `<${slash}h${Number(level) - 1}${suffix}`;
  });
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}

function isoWeekday(isoDate: string): number {
  return new Date(isoDate + 'T12:00:00Z').getUTCDay();
}

export function listDates(db: Db): string[] {
  return db
    .select({ date: articles.date })
    .from(articles)
    .orderBy(desc(articles.date))
    .all()
    .map((r) => r.date);
}

export async function parseContent(db: Db, date: string): Promise<BulletinDetail> {
  const article = db
    .select()
    .from(articles)
    .where(lte(articles.date, date))
    .orderBy(desc(articles.date))
    .limit(1)
    .get();

  if (!article) throw new Error(`No article found for date ${date}`);

  const sections: BulletinSections = {};

  sections.article = promoteHeadings(String(await marked(article.content)));

  const weeklyAgenda = buildWeeklyAgendaSection(db, date);
  if (weeklyAgenda) sections.weekly_agenda = weeklyAgenda;

  const announcementsSection = buildAnnouncementsSection(db, date);
  if (announcementsSection) sections.announcements = announcementsSection;

  const birthdaysSection = buildBirthdaysSection(db, date);
  if (birthdaysSection) sections.birthdays = birthdaysSection;

  const liturgySection = buildLiturgySection(db, date);
  if (liturgySection) sections.liturgy = liturgySection;

  return { title: article.title, date: article.date, sections };
}

function buildWeeklyAgendaSection(db: Db, sunday: string): string | null {
  const monday = addDays(sunday, 1);
  const nextSunday = addDays(sunday, 7);

  const rows = db
    .select()
    .from(agenda)
    .where(
      sql`${agenda.is_recurring} = 1 OR (${agenda.event_date} IS NOT NULL AND ${agenda.event_date} BETWEEN ${monday} AND ${nextSunday})`,
    )
    .orderBy(asc(agenda.weekday), asc(agenda.event_date), asc(agenda.time))
    .all();

  if (rows.length === 0) return null;

  const byDay = new Map<number, typeof rows>();
  for (const row of rows) {
    const day = row.is_recurring && row.weekday !== null ? row.weekday : isoWeekday(row.event_date ?? '');
    const existing = byDay.get(day) ?? [];
    existing.push(row);
    byDay.set(day, existing);
  }

  const parts: string[] = [];
  for (const [day, events] of [...byDay.entries()].sort(([a], [b]) => a - b)) {
    parts.push(`<h3>${WEEKDAY_NAMES[day]}</h3><ul>`);
    for (const e of events) {
      const time = e.time ? `<strong>${e.time}</strong> — ` : '';
      const desc = e.description ? `<br><em>${e.description}</em>` : '';
      parts.push(`<li>${time}${e.title}${desc}</li>`);
    }
    parts.push('</ul>');
  }

  return parts.join('');
}

function buildAnnouncementsSection(db: Db, sunday: string): string | null {
  const rows = db
    .select()
    .from(announcements)
    .where(gte(announcements.expires_at, sunday))
    .orderBy(asc(announcements.created_at))
    .all();

  if (rows.length === 0) return null;

  return rows
    .map((a) => {
      const link = a.url ? ` <a href="${a.url}">Mais informações</a>` : '';
      const desc = a.description ? `<p>${a.description}${link}</p>` : link ? `<p>${link}</p>` : '';
      return `<h3>${a.title}</h3>${desc}`;
    })
    .join('');
}

function buildBirthdaysSection(db: Db, sunday: string): string | null {
  const saturday = addDays(sunday, 6);
  const sundayMD = sunday.slice(5);
  const saturdayMD = saturday.slice(5);

  const condition =
    sundayMD <= saturdayMD
      ? between(sql`strftime('%m-%d', ${members.birth_date})`, sundayMD, saturdayMD)
      : sql`strftime('%m-%d', ${members.birth_date}) >= ${sundayMD} OR strftime('%m-%d', ${members.birth_date}) <= ${saturdayMD}`;

  const rows = db
    .select()
    .from(members)
    .where(and(sql`${members.status} = 'active'`, condition))
    .orderBy(asc(sql`strftime('%m-%d', ${members.birth_date})`))
    .all();

  if (rows.length === 0) return null;

  const byDate = new Map<string, string[]>();
  for (const m of rows) {
    const dateKey = m.birth_date?.slice(5);
    if (!dateKey) continue;
    const existing = byDate.get(dateKey) ?? [];
    existing.push(m.full_name);
    byDate.set(dateKey, existing);
  }

  const parts: string[] = [];
  for (const [md, names] of byDate.entries()) {
    const isoDate = sunday.slice(0, 4) + '-' + md;
    const weekday = WEEKDAY_NAMES[isoWeekday(isoDate)];
    parts.push(`<h3>${formatDayMonth(isoDate)} — ${weekday}</h3><ul>`);
    for (const name of names) parts.push(`<li>${name}</li>`);
    parts.push('</ul>');
  }

  return parts.join('');
}

function buildLiturgySection(db: Db, date: string): string | null {
  const liturgy = db
    .select()
    .from(liturgies)
    .where(sql`${liturgies.date} = ${date}`)
    .limit(1)
    .get();
  if (!liturgy) return null;

  const acts = db
    .select()
    .from(liturgyActs)
    .where(sql`${liturgyActs.liturgy_id} = ${liturgy.id}`)
    .orderBy(asc(liturgyActs.position))
    .all();

  if (acts.length === 0) return null;

  const parts: string[] = [];
  for (const act of acts) {
    parts.push(`<h2>${act.name}</h2><ul>`);

    const moments = db
      .select({
        moment: liturgyMoments,
        songTitle: songs.title,
        songAlbum: songs.album,
        songTrack: songs.track,
        songLyrics: songs.lyrics,
      })
      .from(liturgyMoments)
      .where(sql`${liturgyMoments.act_id} = ${act.id}`)
      .leftJoin(songs, sql`${songs.id} = ${liturgyMoments.song_id}`)
      .orderBy(asc(liturgyMoments.position))
      .all();

    for (const { moment, songTitle, songAlbum, songTrack, songLyrics } of moments) {
      const label = MOMENT_TYPE_LABELS[moment.type] ?? moment.type;
      let detail = '';

      if (moment.type === 'song' && songTitle) {
        const ref = songAlbum && songTrack ? ` — ${songTrack}. ${songAlbum}` : '';
        const lyricsHtml = songLyrics ? `<p>${songLyrics.replace(/\n/g, '<br>')}</p>` : '';
        detail = `${songTitle}${ref}${lyricsHtml}`;
      } else if (moment.type === 'bible_reading' && moment.scripture_passages) {
        try {
          const passages = JSON.parse(moment.scripture_passages) as Array<{
            reference: string;
            text?: string;
            version?: string;
          }>;
          detail = passages
            .map((p) => {
              const header = p.version ? `${p.reference} (${p.version})` : p.reference;
              const body = p.text ? `<p><em>${p.text.replace(/\n/g, '<br>')}</em></p>` : '';
              return `${header}${body}`;
            })
            .join('');
        } catch {
          detail = moment.scripture_passages;
        }
      } else if (moment.type === 'sermon') {
        const speaker = moment.sermon_speaker ?? '';
        const theme = moment.sermon_theme ? `<em>${moment.sermon_theme}</em>` : '';
        const ref = moment.sermon_reference ? ` (${moment.sermon_reference})` : '';
        const themeRef = `${theme}${ref}`;
        detail = [speaker, themeRef].filter(Boolean).join(' — ');
      } else if (moment.description) {
        detail = moment.description;
      }

      const content = detail ? `<strong>${label}:</strong> ${detail}` : `<strong>${label}</strong>`;
      parts.push(`<li>${content}</li>`);
    }

    parts.push('</ul>');
  }

  return parts.join('');
}
