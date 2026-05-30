import { and, asc, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import type { AnnouncementItem, AnnouncementListResponse, AnnouncementStatus } from '../../../shared/announcement';
import type { DbInstance } from '../../db/client';
import { announcements } from '../../db/schema';

export type { AnnouncementItem, AnnouncementListResponse, AnnouncementStatus };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function listAnnouncements(
  db: DbInstance,
  page: number,
  limit: number,
  status: AnnouncementStatus,
): AnnouncementListResponse {
  const notDeleted = isNull(announcements.deleted_at);
  const where =
    status === 'active'
      ? and(notDeleted, gte(announcements.expires_at, today()))
      : status === 'expired'
        ? and(notDeleted, lt(announcements.expires_at, today()))
        : notDeleted;

  const orderBy =
    status === 'active'
      ? [asc(announcements.expires_at), asc(announcements.id)]
      : [desc(announcements.expires_at), desc(announcements.id)];

  const totalRow = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(announcements)
    .where(where)
    .get();
  const total = totalRow?.count ?? 0;

  const data = db
    .select({
      id: announcements.id,
      title: announcements.title,
      description: announcements.description,
      url: announcements.url,
      expires_at: announcements.expires_at,
    })
    .from(announcements)
    .where(where)
    .orderBy(...orderBy)
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  return { data, pagination: { page, limit, total } };
}

export function getAnnouncement(db: DbInstance, id: number): AnnouncementItem | null | 'deleted' {
  const row = db.select().from(announcements).where(eq(announcements.id, id)).limit(1).get();
  if (!row) return null;
  if (row.deleted_at !== null) return 'deleted';
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    url: row.url,
    expires_at: row.expires_at,
  };
}
