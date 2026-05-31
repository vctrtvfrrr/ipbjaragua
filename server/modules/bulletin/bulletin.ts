import { and, asc, between, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
import type { DbInstance } from '../../db/client';
import { agenda, announcements, bulletins, members } from '../../db/schema';
import { getArticleById } from '../articles/articles';
import { getLiturgyById } from '../liturgy/liturgy';
import type { AnnouncementItem } from '~~/shared/announcement';
import type { AgendaGroup, BirthdayGroup, BulletinDetail } from '~~/shared/bulletin';

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
      row.is_recurring || (row.event_date !== null && row.event_date >= window.from && row.event_date <= window.to);

    if (!isInWindow) continue;

    const day = row.is_recurring && row.weekday !== null ? row.weekday : isoWeekday(row.event_date ?? '');

    const existing = byDay.get(day) ?? [];
    existing.push({ time: row.time ?? null, title: row.title, description: row.description ?? null });
    byDay.set(day, existing);
  }

  // The agenda window is the coming week (the day after the bulletin until +7 days), so the listed
  // Sunday is the *next* Sunday and belongs at the end. Sort Sunday (0) as if it were day 7.
  const orderKey = (day: number) => (day === 0 ? 7 : day);

  return [...byDay.entries()]
    .sort(([a], [b]) => orderKey(a) - orderKey(b))
    .map(([day, events]) => ({ weekday: WEEKDAY_NAMES[day] ?? String(day), events }));
}

export type BirthdayRow = {
  full_name: string;
  birth_date: string;
};

export type BirthdayWindow = { from: string; to: string };

// Maps a recurring date (birth/wedding) to its full date within the window by month-day, or null when outside.
// Handles a window that crosses the year boundary (Dec→Jan), placing January days in the later year.
function resolveWindowedDate(recurringDate: string, window: BirthdayWindow): string | null {
  const fromMD = window.from.slice(5);
  const toMD = window.to.slice(5);
  const fromYear = window.from.slice(0, 4);
  const toYear = window.to.slice(0, 4);
  const crossYear = fromYear !== toYear;

  const md = recurringDate.slice(5);
  const inWindow = crossYear ? md >= fromMD || md <= toMD : md >= fromMD && md <= toMD;
  if (!inWindow) return null;

  const year = crossYear && md < fromMD ? toYear : fromYear;
  return `${year}-${md}`;
}

export function buildBirthdays(rows: BirthdayRow[], window: BirthdayWindow): BirthdayGroup[] {
  const byDate = new Map<string, string[]>();

  for (const row of rows) {
    const fullDate = resolveWindowedDate(row.birth_date, window);
    if (fullDate === null) continue;

    const existing = byDate.get(fullDate) ?? [];
    existing.push(row.full_name);
    byDate.set(fullDate, existing);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, names]) => ({
      date,
      weekday: WEEKDAY_NAMES[isoWeekday(date)] ?? String(isoWeekday(date)),
      names,
    }));
}

export type WeddingRow = {
  full_name: string;
  spouse: string | null;
  wedding_date: string | null;
  sex: string | null;
};

type WeddingEntry = { date: string; label: string };

const NAME_PREPOSITIONS = new Set(['de', 'da', 'do', 'dos', 'e']);

// Up to the first two tokens of a name, stopping before a Portuguese preposition: `Ana Lúcia` but `Bruno`.
function shortName(fullName: string): string {
  const tokens = fullName.trim().split(/\s+/);
  const out: string[] = [];
  for (const token of tokens) {
    if (out.length === 2) break;
    if (out.length >= 1 && NAME_PREPOSITIONS.has(token.toLowerCase())) break;
    out.push(token);
  }
  return out.join(' ');
}

// `Woman ♥ Man` (♥ = U+2665): woman-first via `sex`, alphabetical fallback when sex is missing or equal.
function formatCouple(a: WeddingRow, b: WeddingRow): string {
  const aWoman = a.sex === 'Feminino';
  const bWoman = b.sex === 'Feminino';

  let first = a;
  let second = b;
  if (aWoman !== bWoman) {
    [first, second] = aWoman ? [a, b] : [b, a];
  } else if (a.full_name.localeCompare(b.full_name) > 0) {
    [first, second] = [b, a];
  }

  return `${shortName(first.full_name)} ♥ ${shortName(second.full_name)}`;
}

export function buildWeddings(rows: WeddingRow[], window: BirthdayWindow): WeddingEntry[] {
  const byName = new Map<string, WeddingRow>();
  for (const row of rows) {
    byName.set(row.full_name, row);
  }

  const seen = new Set<string>();
  const entries: WeddingEntry[] = [];

  for (const row of rows) {
    if (!row.wedding_date || !row.spouse) continue;

    const partner = byName.get(row.spouse);
    if (!partner || partner.wedding_date !== row.wedding_date) continue;

    const coupleKey = [row.full_name, partner.full_name].sort().join('|');
    if (seen.has(coupleKey)) continue;
    seen.add(coupleKey);

    const date = resolveWindowedDate(row.wedding_date, window);
    if (date === null) continue;

    entries.push({ date, label: formatCouple(row, partner) });
  }

  return entries;
}

// Append each wedding into its day's group (after the day's age birthdays), creating the group when absent.
// Multiple couples on the same day are ordered alphabetically by label; groups stay sorted by date.
export function mergeWeddings(groups: BirthdayGroup[], weddings: WeddingEntry[]): BirthdayGroup[] {
  const byDate = new Map<string, BirthdayGroup>();
  for (const group of groups) {
    byDate.set(group.date, { ...group, names: [...group.names] });
  }

  for (const wedding of [...weddings].sort((a, b) => a.label.localeCompare(b.label))) {
    const existing = byDate.get(wedding.date);
    if (existing) {
      existing.names.push(wedding.label);
    } else {
      byDate.set(wedding.date, {
        date: wedding.date,
        weekday: WEEKDAY_NAMES[isoWeekday(wedding.date)] ?? String(isoWeekday(wedding.date)),
        names: [wedding.label],
      });
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
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

function buildBirthdaysSection(db: Db, birthdaysFrom: string, birthdaysTo: string): BirthdayGroup[] {
  const fromMD = birthdaysFrom.slice(5);
  const toMD = birthdaysTo.slice(5);
  const crossYear = fromMD > toMD;

  const rows = db
    .select({ full_name: members.full_name, birth_date: members.birth_date })
    .from(members)
    .where(
      and(
        sql`${members.status} = 'active'`,
        isNull(members.deleted_at),
        crossYear
          ? or(
              sql`strftime('%m-%d', ${members.birth_date}) >= ${fromMD}`,
              sql`strftime('%m-%d', ${members.birth_date}) <= ${toMD}`,
            )
          : between(sql`strftime('%m-%d', ${members.birth_date})`, fromMD, toMD),
      ),
    )
    .orderBy(asc(sql`strftime('%m-%d', ${members.birth_date})`))
    .all()
    .filter((r): r is { full_name: string; birth_date: string } => r.birth_date !== null);

  const weddingRows = db
    .select({
      full_name: members.full_name,
      spouse: members.spouse,
      wedding_date: members.wedding_date,
      sex: members.sex,
    })
    .from(members)
    .where(
      and(
        sql`${members.status} = 'active'`,
        isNull(members.deleted_at),
        sql`${members.wedding_date} IS NOT NULL`,
        sql`${members.wedding_date} != ''`,
      ),
    )
    .all();

  const window = { from: birthdaysFrom, to: birthdaysTo };
  return mergeWeddings(buildBirthdays(rows, window), buildWeddings(weddingRows, window));
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
    article: row.article_id !== null ? getArticleById(db, row.article_id) : null,
    liturgy: row.liturgy_id !== null ? getLiturgyById(db, row.liturgy_id) : null,
    announcements: row.show_announcements ? buildAnnouncementsSection(db, date) : null,
    agenda: row.show_agenda ? buildAgendaSection(db, row.agenda_from, row.agenda_to) : null,
    birthdays: row.show_birthdays ? buildBirthdaysSection(db, row.birthdays_from, row.birthdays_to) : null,
  };
}
