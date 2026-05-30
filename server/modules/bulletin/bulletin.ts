import { and, asc, between, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
import type { DbInstance } from '../../db/client';
import { agenda, announcements, bulletins } from '../../db/schema';
import type { AnnouncementItem } from '~~/shared/announcement';
import type { AgendaGroup, BulletinDetail } from '~~/shared/bulletin';

export type { BulletinDetail, AgendaGroup, BirthdayGroup } from '~~/shared/bulletin';

type Db = DbInstance;

const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoWeekday(isoDate: string): number {
  return new Date(isoDate + 'T12:00:00Z').getUTCDay();
}

export function defaultWindows(date: string): {
  agenda_from: string;
  agenda_to: string;
  birthdays_from: string;
  birthdays_to: string;
} {
  return {
    agenda_from: addDays(date, 1),
    agenda_to: addDays(date, 7),
    birthdays_from: date,
    birthdays_to: addDays(date, 6),
  };
}

export type AgendaRow = {
  title: string;
  description: string | null;
  time: string | null;
  weekday: number | null;
  is_recurring: boolean;
  event_date: string | null;
};

export type AgendaWindow = { from: string; to: string };

export function buildAgenda(rows: AgendaRow[], window: AgendaWindow): AgendaGroup[] {
  const byDay = new Map<number, { time: string | null; title: string; description: string | null }[]>();

  for (const row of rows) {
    const isInWindow =
      row.is_recurring ||
      (row.event_date !== null && row.event_date >= window.from && row.event_date <= window.to);

    if (!isInWindow) continue;

    const day =
      row.is_recurring && row.weekday !== null ? row.weekday : isoWeekday(row.event_date ?? '');

    const existing = byDay.get(day) ?? [];
    existing.push({ time: row.time ?? null, title: row.title, description: row.description ?? null });
    byDay.set(day, existing);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, events]) => ({ weekday: WEEKDAY_NAMES[day] ?? String(day), events }));
}

export function getCurrentDate(db: Db, today: string): string | null {
  const row = db
    .select({ date: bulletins.date })
    .from(bulletins)
    .where(and(lte(bulletins.date, today), isNull(bulletins.deleted_at)))
    .orderBy(desc(bulletins.date))
    .limit(1)
    .get();

  return row?.date ?? null;
}

function buildAnnouncementsSection(db: Db, date: string): AnnouncementItem[] {
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      description: announcements.description,
      url: announcements.url,
      expires_at: announcements.expires_at,
    })
    .from(announcements)
    .where(and(gte(announcements.expires_at, date), isNull(announcements.deleted_at)))
    .orderBy(asc(announcements.created_at))
    .all();
}

function buildAgendaSection(db: Db, agendaFrom: string, agendaTo: string): AgendaGroup[] {
  const rows = db
    .select({
      title: agenda.title,
      description: agenda.description,
      time: agenda.time,
      weekday: agenda.weekday,
      is_recurring: agenda.is_recurring,
      event_date: agenda.event_date,
    })
    .from(agenda)
    .where(
      and(
        isNull(agenda.deleted_at),
        or(
          sql`${agenda.is_recurring} = 1`,
          and(sql`${agenda.event_date} IS NOT NULL`, between(agenda.event_date, agendaFrom, agendaTo)),
        ),
      ),
    )
    .orderBy(asc(agenda.weekday), asc(agenda.event_date), asc(agenda.time))
    .all();

  return buildAgenda(rows, { from: agendaFrom, to: agendaTo });
}

export function getBulletin(db: Db, date: string): BulletinDetail | null {
  const row = db
    .select()
    .from(bulletins)
    .where(and(eq(bulletins.date, date), isNull(bulletins.deleted_at)))
    .get();

  if (!row) return null;

  return {
    title: row.title,
    date: row.date,
    article: null,
    liturgy: null,
    announcements: row.show_announcements ? buildAnnouncementsSection(db, date) : null,
    agenda: row.show_agenda ? buildAgendaSection(db, row.agenda_from, row.agenda_to) : null,
    birthdays: null,
  };
}
