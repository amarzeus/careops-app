/**
 * Timezone-aware date utilities
 * Handles conversion between local times and UTC for bookings
 */

import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

/**
 * Convert a local date/time to UTC
 * @param localDate - Local date object or ISO string
 * @param timezone - IANA timezone (e.g., 'America/New_York', 'Europe/London')
 * @returns UTC Date object
 */
export function toUTC(localDate: Date | string, timezone: string): Date {
  const date = typeof localDate === 'string' ? new Date(localDate) : localDate;
  return fromZonedTime(date, timezone);
}

/**
 * Convert a UTC date to local time in specified timezone
 * @param utcDate - UTC date object
 * @param timezone - IANA timezone
 * @returns Date object in local timezone
 */
export function fromUTC(utcDate: Date, timezone: string): Date {
  return toZonedTime(utcDate, timezone);
}

/**
 * Parse local date and time strings to UTC
 * @param dateStr - Date string (YYYY-MM-DD)
 * @param timeStr - Time string (HH:mm)
 * @param timezone - IANA timezone
 * @returns UTC Date object
 */
export function parseLocalDateTime(
  dateStr: string,
  timeStr: string,
  timezone: string
): Date {
  const localDateTime = new Date(`${dateStr}T${timeStr}:00`);
  return toUTC(localDateTime, timezone);
}

/**
 * Format a UTC date for display in a specific timezone
 * @param utcDate - UTC date
 * @param timezone - IANA timezone
 * @param formatStr - Format string (date-fns format)
 * @returns Formatted string
 */
export function formatInTimeZone(
  utcDate: Date,
  timezone: string,
  formatStr: string = 'PPp'
): string {
  const zonedDate = fromUTC(utcDate, timezone);
  return format(zonedDate, formatStr);
}

/**
 * Get the current date in a specific timezone
 * @param timezone - IANA timezone
 * @returns Date object representing now in that timezone
 */
export function nowInTimeZone(timezone: string): Date {
  return fromUTC(new Date(), timezone);
}

/**
 * Check if a date is valid
 * @param date - Date to check
 * @returns Boolean indicating validity
 */
export function isValidDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Common timezones list for UI dropdown
 */
export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
];

/**
 * Get client's timezone from browser
 * @returns IANA timezone string
 */
export function getClientTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert booking time from workspace timezone to client's local timezone
 * @param bookingDate - UTC booking date from database
 * @param workspaceTimezone - Workspace's timezone
 * @returns Object with formatted times
 */
export function formatBookingForDisplay(
  bookingDate: Date,
  workspaceTimezone: string
): {
  workspaceTime: string;
  workspaceDate: string;
  localTime: string;
  localDate: string;
  timezone: string;
} {
  const workspaceZoned = fromUTC(bookingDate, workspaceTimezone);
  const localZoned = fromUTC(bookingDate, getClientTimezone());

  return {
    workspaceTime: format(workspaceZoned, 'h:mm a'),
    workspaceDate: format(workspaceZoned, 'EEEE, MMMM d, yyyy'),
    localTime: format(localZoned, 'h:mm a'),
    localDate: format(localZoned, 'EEEE, MMMM d, yyyy'),
    timezone: getClientTimezone(),
  };
}