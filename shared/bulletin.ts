import type { AnnouncementItem } from './announcement';
import type { ArticleDetail } from './article';
import type { LiturgyDetail } from './liturgy';

export type AgendaItem = {
  time: string | null;
  title: string;
  description: string | null;
};

export type AgendaGroup = {
  weekday: string;
  events: AgendaItem[];
};

export type BirthdayGroup = {
  date: string;
  weekday: string;
  names: string[];
};

export type BulletinDetail = {
  title: string | null;
  date: string;
  article: ArticleDetail | null;
  liturgy: LiturgyDetail | null;
  announcements: AnnouncementItem[] | null;
  agenda: AgendaGroup[] | null;
  birthdays: BirthdayGroup[] | null;
};
