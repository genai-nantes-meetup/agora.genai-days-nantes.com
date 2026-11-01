import { MESSAGING_CLOSES_AT } from './messaging';

/** App emails stop when messaging becomes read-only (24 Nov 2026, 00:00 Paris). Auth emails are unaffected. */
export const APP_EMAILS_CLOSE_AT = MESSAGING_CLOSES_AT;
export const REMINDER_DELAY_MS = 5 * 60 * 1000;
export const APP_URL = 'https://hey.genai-days-nantes.com';

export function appEmailsAllowed(now = new Date()) {
  return now.getTime() < Date.parse(APP_EMAILS_CLOSE_AT);
}

export type EmailLang = 'fr' | 'en';
export function emailLang(value: unknown): EmailLang {
  return value === 'en' ? 'en' : 'fr';
}

/**
 * One reminder per conversation until the recipient reads:
 * due when the newest unread message from the other person is at least 5 minutes old
 * and no reminder is pending (none sent yet, or the recipient has read up to the last reminded message).
 */
export function reminderDue(input: {
  latestIndex: number;
  latestAt: string | Date;
  readIndex: number;
  lastReminderIndex: number | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  if (!appEmailsAllowed(now)) return false;
  if (input.latestIndex <= input.readIndex) return false;
  if (now.getTime() - new Date(input.latestAt).getTime() < REMINDER_DELAY_MS) return false;
  return input.lastReminderIndex === null || input.readIndex >= input.lastReminderIndex;
}
