import { and, asc, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import type { DbInstance } from '../../db/client';
import { announcements, bulletins } from '../../db/schema';
import type { AnnouncementItem } from '~~/shared/announcement';
import type { BulletinDetail } from '~~/shared/bulletin';

export type { BulletinDetail, AgendaGroup, BirthdayGroup } from '~~/shared/bulletin';

type Db = DbInstance;

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
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

function buildAnnouncements(db: Db, date: string): AnnouncementItem[] {
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
    announcements: row.show_announcements ? buildAnnouncements(db, date) : null,
    agenda: null,
    birthdays: null,
  };
}
