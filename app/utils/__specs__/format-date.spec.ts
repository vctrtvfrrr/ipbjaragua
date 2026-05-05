import { describe, expect, test } from 'vitest';
import formatDate from '../format-date';

describe('formatDate', () => {
  test('formats a date in pt-BR long format', () => {
    expect(formatDate('2026-05-03')).toBe('03 de maio de 2026');
  });

  test('pads single-digit days with a leading zero', () => {
    expect(formatDate('2026-01-01')).toBe('01 de janeiro de 2026');
  });

  test('formats the last day of the year correctly', () => {
    expect(formatDate('2026-12-31')).toBe('31 de dezembro de 2026');
  });

  test('does not shift the day due to timezone offset', () => {
    // T12:00:00 anchors noon so UTC-12..UTC+12 all resolve to the same date
    expect(formatDate('2026-03-01')).toContain('01');
    expect(formatDate('2026-03-01')).not.toContain('28');
  });
});
