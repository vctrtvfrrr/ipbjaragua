import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { beforeEach, describe, expect, test } from 'vitest';
import * as schema from '../../../db/schema';
import {
  buildAgenda,
  buildBirthdays,
  defaultWindows,
  getBulletin,
  getCurrentDate,
  type AgendaRow,
  type BirthdayRow,
} from '../bulletin';

const testDb = drizzle(new Database(':memory:'), { schema });
migrate(testDb, { migrationsFolder: './server/db/migrations' });

const BASE_WINDOWS = {
  agenda_from: '2026-05-18',
  agenda_to: '2026-05-24',
  birthdays_from: '2026-05-17',
  birthdays_to: '2026-05-23',
};

function insertBulletin(overrides: Partial<typeof schema.bulletins.$inferInsert> = {}) {
  return testDb
    .insert(schema.bulletins)
    .values({
      date: '2026-05-17',
      agenda_from: BASE_WINDOWS.agenda_from,
      agenda_to: BASE_WINDOWS.agenda_to,
      birthdays_from: BASE_WINDOWS.birthdays_from,
      birthdays_to: BASE_WINDOWS.birthdays_to,
      ...overrides,
    })
    .run();
}

describe('defaultWindows', () => {
  test('computes agenda window as date+1 to date+7', () => {
    const w = defaultWindows('2026-05-17');
    expect(w.agenda_from).toBe('2026-05-18');
    expect(w.agenda_to).toBe('2026-05-24');
  });

  test('computes birthdays window as date to date+6', () => {
    const w = defaultWindows('2026-05-17');
    expect(w.birthdays_from).toBe('2026-05-17');
    expect(w.birthdays_to).toBe('2026-05-23');
  });

  test('works for non-sunday dates', () => {
    const w = defaultWindows('2026-05-20');
    expect(w.agenda_from).toBe('2026-05-21');
    expect(w.agenda_to).toBe('2026-05-27');
    expect(w.birthdays_from).toBe('2026-05-20');
    expect(w.birthdays_to).toBe('2026-05-26');
  });

  test('handles month boundaries correctly', () => {
    const w = defaultWindows('2026-01-28');
    expect(w.agenda_from).toBe('2026-01-29');
    expect(w.agenda_to).toBe('2026-02-04');
    expect(w.birthdays_to).toBe('2026-02-03');
  });
});

const BASE_WINDOW = { from: '2026-05-18', to: '2026-05-24' };

function recurringRow(overrides: Partial<AgendaRow> = {}): AgendaRow {
  return {
    title: 'Reunião de Oração',
    description: null,
    time: '19:30',
    weekday: 3,
    is_recurring: true,
    event_date: null,
    ...overrides,
  };
}

function eventRow(overrides: Partial<AgendaRow> = {}): AgendaRow {
  return {
    title: 'Conferência',
    description: null,
    time: '18:00',
    weekday: null,
    is_recurring: false,
    event_date: '2026-05-20',
    ...overrides,
  };
}

describe('buildAgenda', () => {
  test('returns empty array when no rows', () => {
    expect(buildAgenda([], BASE_WINDOW)).toEqual([]);
  });

  test('includes recurring events regardless of window', () => {
    const result = buildAgenda([recurringRow({ weekday: 3 })], BASE_WINDOW);
    expect(result).toHaveLength(1);
    expect(result[0]?.weekday).toBe('Quarta-feira');
  });

  test('includes dated events within the window', () => {
    const result = buildAgenda([eventRow({ event_date: '2026-05-20' })], BASE_WINDOW);
    expect(result).toHaveLength(1);
    expect(result[0]?.events[0]?.title).toBe('Conferência');
  });

  test('excludes dated events outside the window', () => {
    const result = buildAgenda([eventRow({ event_date: '2026-05-25' })], BASE_WINDOW);
    expect(result).toEqual([]);
  });

  test('window is inclusive on both ends', () => {
    const fromResult = buildAgenda([eventRow({ event_date: '2026-05-18' })], BASE_WINDOW);
    const toResult = buildAgenda([eventRow({ event_date: '2026-05-24' })], BASE_WINDOW);
    expect(fromResult).toHaveLength(1);
    expect(toResult).toHaveLength(1);
  });

  test('groups multiple events by weekday', () => {
    const rows = [
      recurringRow({ title: 'Reunião', weekday: 3, time: '19:30' }),
      eventRow({ title: 'Evento Quarta', event_date: '2026-05-20' }), // also Wednesday
    ];
    const result = buildAgenda(rows, BASE_WINDOW);
    expect(result).toHaveLength(1);
    expect(result[0]?.events).toHaveLength(2);
  });

  test('groups are sorted by weekday', () => {
    const rows = [
      eventRow({ title: 'Sexta', event_date: '2026-05-22' }),
      recurringRow({ title: 'Segunda', weekday: 1 }),
    ];
    const result = buildAgenda(rows, BASE_WINDOW);
    expect(result[0]?.weekday).toBe('Segunda-feira');
    expect(result[1]?.weekday).toBe('Sexta-feira');
  });

  test('maps event fields correctly', () => {
    const result = buildAgenda([recurringRow({ title: 'Culto', time: '09:00', description: 'Manhã' })], BASE_WINDOW);
    expect(result[0]?.events[0]).toEqual({ time: '09:00', title: 'Culto', description: 'Manhã' });
  });

  test('uses null for missing time and description', () => {
    const result = buildAgenda([recurringRow({ time: null, description: null })], BASE_WINDOW);
    expect(result[0]?.events[0]?.time).toBeNull();
    expect(result[0]?.events[0]?.description).toBeNull();
  });
});

const BIRTHDAY_WINDOW = { from: '2026-05-17', to: '2026-05-23' };

function birthdayRow(md: string, name: string = 'João Silva'): BirthdayRow {
  return { full_name: name, birth_date: `1990-${md}` };
}

describe('buildBirthdays', () => {
  test('returns empty array when no rows', () => {
    expect(buildBirthdays([], BIRTHDAY_WINDOW)).toEqual([]);
  });

  test('includes member with birthday within window', () => {
    const result = buildBirthdays([birthdayRow('05-20')], BIRTHDAY_WINDOW);
    expect(result).toHaveLength(1);
    expect(result[0]?.names).toContain('João Silva');
  });

  test('excludes member with birthday outside window', () => {
    const result = buildBirthdays([birthdayRow('05-24')], BIRTHDAY_WINDOW);
    expect(result).toEqual([]);
  });

  test('window is inclusive on both ends', () => {
    const fromResult = buildBirthdays([birthdayRow('05-17')], BIRTHDAY_WINDOW);
    const toResult = buildBirthdays([birthdayRow('05-23')], BIRTHDAY_WINDOW);
    expect(fromResult).toHaveLength(1);
    expect(toResult).toHaveLength(1);
  });

  test('groups multiple people with the same birthday date', () => {
    const result = buildBirthdays([birthdayRow('05-20', 'João'), birthdayRow('05-20', 'Maria')], BIRTHDAY_WINDOW);
    expect(result).toHaveLength(1);
    expect(result[0]?.names).toHaveLength(2);
  });

  test('groups are sorted by date', () => {
    const result = buildBirthdays([birthdayRow('05-22', 'B'), birthdayRow('05-19', 'A')], BIRTHDAY_WINDOW);
    expect(result[0]?.date).toBe('2026-05-19');
    expect(result[1]?.date).toBe('2026-05-22');
  });

  test('includes weekday name in group', () => {
    const result = buildBirthdays([birthdayRow('05-17')], BIRTHDAY_WINDOW);
    expect(result[0]?.weekday).toBe('Domingo');
  });

  test('handles year crossover (window spans Dec→Jan)', () => {
    const crossWindow = { from: '2026-12-28', to: '2027-01-03' };
    const result = buildBirthdays([birthdayRow('12-30', 'Dez'), birthdayRow('01-02', 'Jan')], crossWindow);
    expect(result).toHaveLength(2);
    expect(result.find((g) => g.names.includes('Dez'))?.date).toBe('2026-12-30');
    expect(result.find((g) => g.names.includes('Jan'))?.date).toBe('2027-01-02');
  });

  test('excludes birthdays outside cross-year window', () => {
    const crossWindow = { from: '2026-12-28', to: '2027-01-03' };
    const result = buildBirthdays([birthdayRow('12-27'), birthdayRow('01-04')], crossWindow);
    expect(result).toEqual([]);
  });
});

describe('getBulletin', () => {
  beforeEach(() => {
    testDb.delete(schema.members).run();
    testDb.delete(schema.agenda).run();
    testDb.delete(schema.announcements).run();
    testDb.delete(schema.bulletins).run();
    testDb.delete(schema.articles).run();
    testDb.delete(schema.liturgyMoments).run();
    testDb.delete(schema.liturgyActs).run();
    testDb.delete(schema.liturgies).run();
  });

  test('returns null when no bulletin exists for the given date', () => {
    expect(getBulletin(testDb, '2026-05-17')).toBeNull();
  });

  test('returns BulletinDetail with title and date', () => {
    insertBulletin({ title: 'Culto de Testemunho' });
    const result = getBulletin(testDb, '2026-05-17');
    expect(result?.title).toBe('Culto de Testemunho');
    expect(result?.date).toBe('2026-05-17');
  });

  test('returns null title when title is not set', () => {
    insertBulletin();
    const result = getBulletin(testDb, '2026-05-17');
    expect(result?.title).toBeNull();
  });

  test('liturgy is null (not yet implemented)', () => {
    insertBulletin();
    expect(getBulletin(testDb, '2026-05-17')?.liturgy).toBeNull();
  });

  describe('article section', () => {
    test('returns null when article_id is null', () => {
      insertBulletin();
      expect(getBulletin(testDb, '2026-05-17')?.article).toBeNull();
    });

    test('embeds the full ArticleDetail when article_id is set', () => {
      const articleResult = testDb
        .insert(schema.articles)
        .values({ slug: 'reflexao', title: 'Reflexão', date: '2026-05-17', content: 'Conteúdo.' })
        .returning()
        .get();
      insertBulletin({ article_id: articleResult.id });

      const result = getBulletin(testDb, '2026-05-17');
      expect(result?.article?.slug).toBe('reflexao');
      expect(result?.article?.content).toBe('Conteúdo.');
    });

    test('returns null for article_id pointing to a deleted article', () => {
      const articleResult = testDb
        .insert(schema.articles)
        .values({
          slug: 'removido',
          title: 'Removido',
          date: '2026-05-17',
          content: 'x',
          deleted_at: '2026-05-18',
        })
        .returning()
        .get();
      insertBulletin({ article_id: articleResult.id });

      expect(getBulletin(testDb, '2026-05-17')?.article).toBeNull();
    });
  });

  describe('liturgy section', () => {
    test('returns null when liturgy_id is null', () => {
      insertBulletin();
      expect(getBulletin(testDb, '2026-05-17')?.liturgy).toBeNull();
    });

    test('embeds the full LiturgyDetail when liturgy_id is set', () => {
      const liturgyResult = testDb
        .insert(schema.liturgies)
        .values({ date: '2026-05-17', theme: 'Cristo, Nossa Páscoa' })
        .returning()
        .get();
      insertBulletin({ liturgy_id: liturgyResult.id });

      const result = getBulletin(testDb, '2026-05-17');
      expect(result?.liturgy?.theme).toBe('Cristo, Nossa Páscoa');
      expect(result?.liturgy?.date).toBe('2026-05-17');
    });
  });

  test('returns null for soft-deleted bulletin', () => {
    insertBulletin({ deleted_at: '2026-05-18T10:00:00' });
    expect(getBulletin(testDb, '2026-05-17')).toBeNull();
  });

  test('returns null for a different date', () => {
    insertBulletin({ date: '2026-05-10' });
    expect(getBulletin(testDb, '2026-05-17')).toBeNull();
  });

  describe('announcements section', () => {
    test('returns null when show_announcements is false', () => {
      insertBulletin({ show_announcements: false });
      expect(getBulletin(testDb, '2026-05-17')?.announcements).toBeNull();
    });

    test('returns empty array when show_announcements is true but no active announcements', () => {
      insertBulletin({ show_announcements: true });
      expect(getBulletin(testDb, '2026-05-17')?.announcements).toEqual([]);
    });

    test('returns active announcements (expires_at >= bulletin date)', () => {
      insertBulletin();
      testDb.insert(schema.announcements).values({ title: 'Conferência da Fé', expires_at: '2026-05-17' }).run();

      const result = getBulletin(testDb, '2026-05-17');
      expect(result?.announcements).toHaveLength(1);
      expect(result?.announcements?.[0]?.title).toBe('Conferência da Fé');
    });

    test('excludes announcements that expired before the bulletin date', () => {
      insertBulletin();
      testDb.insert(schema.announcements).values({ title: 'Aviso expirado', expires_at: '2026-05-16' }).run();

      expect(getBulletin(testDb, '2026-05-17')?.announcements).toEqual([]);
    });

    test('excludes soft-deleted announcements', () => {
      insertBulletin();
      testDb
        .insert(schema.announcements)
        .values({ title: 'Aviso removido', expires_at: '2026-05-24', deleted_at: '2026-05-15' })
        .run();

      expect(getBulletin(testDb, '2026-05-17')?.announcements).toEqual([]);
    });

    test('reflects the bulletin date, not today (historical bulletin shows past-expired announcements)', () => {
      insertBulletin({ date: '2026-01-05' });
      testDb.insert(schema.announcements).values({ title: 'Aviso de janeiro', expires_at: '2026-01-10' }).run();

      const result = getBulletin(testDb, '2026-01-05');
      expect(result?.announcements).toHaveLength(1);
    });
  });

  describe('agenda section', () => {
    test('returns null when show_agenda is false', () => {
      insertBulletin({ show_agenda: false });
      expect(getBulletin(testDb, '2026-05-17')?.agenda).toBeNull();
    });

    test('returns empty array when show_agenda is true but no events in window', () => {
      insertBulletin({ show_agenda: true });
      expect(getBulletin(testDb, '2026-05-17')?.agenda).toEqual([]);
    });

    test('returns recurring events', () => {
      insertBulletin();
      testDb
        .insert(schema.agenda)
        .values({ title: 'Reunião de Oração', weekday: 3, time: '19:30', is_recurring: true })
        .run();

      const result = getBulletin(testDb, '2026-05-17');
      expect(result?.agenda).toHaveLength(1);
      expect(result?.agenda?.[0]?.weekday).toBe('Quarta-feira');
    });

    test('returns dated events within the agenda window', () => {
      insertBulletin();
      testDb
        .insert(schema.agenda)
        .values({ title: 'Conferência', weekday: null, time: null, is_recurring: false, event_date: '2026-05-20' })
        .run();

      const result = getBulletin(testDb, '2026-05-17');
      expect(result?.agenda).toHaveLength(1);
    });

    test('excludes dated events outside the window', () => {
      insertBulletin();
      testDb
        .insert(schema.agenda)
        .values({ title: 'Evento futuro', weekday: null, time: null, is_recurring: false, event_date: '2026-05-25' })
        .run();

      expect(getBulletin(testDb, '2026-05-17')?.agenda).toEqual([]);
    });
  });

  describe('birthdays section', () => {
    test('returns null when show_birthdays is false', () => {
      insertBulletin({ show_birthdays: false });
      expect(getBulletin(testDb, '2026-05-17')?.birthdays).toBeNull();
    });

    test('returns empty array when show_birthdays is true but no active members have birthdays in window', () => {
      insertBulletin({ show_birthdays: true });
      expect(getBulletin(testDb, '2026-05-17')?.birthdays).toEqual([]);
    });

    test('returns members with birthdays in window', () => {
      insertBulletin();
      testDb
        .insert(schema.members)
        .values({ full_name: 'João Silva', birth_date: '1990-05-20', status: 'active' })
        .run();

      const result = getBulletin(testDb, '2026-05-17');
      expect(result?.birthdays).toHaveLength(1);
      expect(result?.birthdays?.[0]?.names).toContain('João Silva');
    });

    test('excludes inactive members', () => {
      insertBulletin();
      testDb
        .insert(schema.members)
        .values({ full_name: 'Membro Inativo', birth_date: '1990-05-20', status: 'transferred' })
        .run();

      expect(getBulletin(testDb, '2026-05-17')?.birthdays).toEqual([]);
    });
  });
});

describe('getCurrentDate', () => {
  beforeEach(() => {
    testDb.delete(schema.bulletins).run();
  });

  test('returns null when no bulletins exist', () => {
    expect(getCurrentDate(testDb, '2026-05-20')).toBeNull();
  });

  test('returns the most recent bulletin date on or before today', () => {
    insertBulletin({ date: '2026-05-03' });
    insertBulletin({ date: '2026-05-17' });
    insertBulletin({ date: '2026-04-19' });
    expect(getCurrentDate(testDb, '2026-05-20')).toBe('2026-05-17');
  });

  test('ignores future-dated bulletins', () => {
    insertBulletin({ date: '2026-05-17' });
    insertBulletin({ date: '2026-05-24' });
    expect(getCurrentDate(testDb, '2026-05-20')).toBe('2026-05-17');
  });

  test('returns null when every bulletin is in the future', () => {
    insertBulletin({ date: '2026-06-01' });
    expect(getCurrentDate(testDb, '2026-05-20')).toBeNull();
  });

  test('excludes soft-deleted bulletins', () => {
    insertBulletin({ date: '2026-05-17', deleted_at: '2026-05-18T10:00:00' });
    expect(getCurrentDate(testDb, '2026-05-20')).toBeNull();
  });

  test('returns non-deleted when some are soft-deleted', () => {
    insertBulletin({ date: '2026-05-17', deleted_at: '2026-05-18T10:00:00' });
    insertBulletin({ date: '2026-05-10' });
    expect(getCurrentDate(testDb, '2026-05-20')).toBe('2026-05-10');
  });
});
