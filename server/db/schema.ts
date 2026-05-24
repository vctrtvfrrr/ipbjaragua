import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const articles = sqliteTable('articles', {
  id: int('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  author: text('author'),
  date: text('date').notNull(),
  content: text('content').notNull(),
});

export const agenda = sqliteTable('agenda', {
  id: int('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  weekday: int('weekday'),
  time: text('time'),
  is_recurring: int('is_recurring', { mode: 'boolean' }).notNull(),
  event_date: text('event_date'),
});

export const announcements = sqliteTable('announcements', {
  id: int('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  created_at: text('created_at').notNull(),
  expires_at: text('expires_at').notNull(),
});

export const members = sqliteTable('members', {
  id: int('id').primaryKey({ autoIncrement: true }),
  full_name: text('full_name').notNull(),
  sex: text('sex'),
  mother: text('mother'),
  father: text('father'),
  birth_date: text('birth_date'),
  birth_place: text('birth_place'),
  marital_status: text('marital_status'),
  wedding_date: text('wedding_date'),
  spouse: text('spouse'),
  phone: text('phone'),
  email: text('email'),
  address_street: text('address_street'),
  address_number: text('address_number'),
  address_complement: text('address_complement'),
  nationality: text('nationality'),
  education: text('education'),
  profession: text('profession'),
  home_church: text('home_church'),
  baptism_year: int('baptism_year'),
  baptism_place: text('baptism_place'),
  prof_faith_year: int('prof_faith_year'),
  prof_faith_place: text('prof_faith_place'),
  member_since: text('member_since'),
  member_until: text('member_until'),
  status: text('status', { enum: ['active', 'transferred', 'deceased', 'removed'] }).notNull(),
});

export const songs = sqliteTable('songs', {
  id: int('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  songwriter: text('songwriter'),
  performer: text('performer'),
  album: text('album'),
  track: int('track'),
  lyrics: text('lyrics'),
});

export const liturgies = sqliteTable('liturgies', {
  id: int('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  theme: text('theme'),
});

export const liturgyActs = sqliteTable('liturgy_acts', {
  id: int('id').primaryKey({ autoIncrement: true }),
  liturgy_id: int('liturgy_id')
    .notNull()
    .references(() => liturgies.id),
  position: int('position').notNull(),
  name: text('name').notNull(),
});

export const liturgyMoments = sqliteTable('liturgy_moments', {
  id: int('id').primaryKey({ autoIncrement: true }),
  act_id: int('act_id')
    .notNull()
    .references(() => liturgyActs.id),
  position: int('position').notNull(),
  type: text('type', {
    enum: ['bible_reading', 'song', 'prayer', 'sermon', 'sacrament', 'pastoral_act', 'other'],
  }).notNull(),
  song_id: int('song_id').references(() => songs.id),
  scripture_passages: text('scripture_passages'),
  description: text('description'),
  sermon_speaker: text('sermon_speaker'),
  sermon_reference: text('sermon_reference'),
  sermon_theme: text('sermon_theme'),
  sacrament_type: text('sacrament_type', { enum: ['baptism', 'eucharist'] }),
});
