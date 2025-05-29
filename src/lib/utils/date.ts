import { parseISO, startOfDay, format } from 'date-fns';

/**
 * Parse a date string as a local date (not UTC)
 * This is important for dates stored as DATE type in the database
 * which don't have timezone information
 */
export function parseLocalDate(dateStr: string): Date {
  // If the date string is in YYYY-MM-DD format, parse it as local date
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  // Otherwise, parse as ISO date and get start of day in local timezone
  return startOfDay(parseISO(dateStr));
}

/**
 * Format a date for display, ensuring local timezone is used
 */
export function formatLocalDate(
  date: Date | string,
  formatStr: string,
): string {
  const dateObj = typeof date === 'string' ? parseLocalDate(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Check if a date is today in the local timezone
 */
export function isLocalToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseLocalDate(date) : date;
  const today = startOfDay(new Date());
  return dateObj.getTime() === today.getTime();
}

/**
 * Check if a date is tomorrow in the local timezone
 */
export function isLocalTomorrow(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseLocalDate(date) : date;
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateObj.getTime() === tomorrow.getTime();
}
