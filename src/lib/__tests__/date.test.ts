import { describe, it, expect } from 'vitest';
import {
  parseLocalDate,
  formatLocalDate,
  isLocalToday,
  isLocalTomorrow,
} from '../utils/date';

describe('date utilities', () => {
  it('parses YYYY-MM-DD as local date', () => {
    const date = parseLocalDate('2024-05-10');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(10);
  });

  it('parses ISO string at start of local day', () => {
    const date = parseLocalDate('2024-05-10T12:00:00Z');
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
  });

  it('formats date using local timezone', () => {
    const str = formatLocalDate('2024-05-10', 'yyyy-MM-dd');
    expect(str).toBe('2024-05-10');
  });

  it('checks today and tomorrow correctly', () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    expect(isLocalToday(today)).toBe(true);
    expect(isLocalTomorrow(tomorrow)).toBe(true);
  });
});
