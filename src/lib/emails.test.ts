import { describe, expect, it } from 'vitest';
import { appEmailsAllowed, emailLang, reminderDue } from './emails';

const base = { latestIndex: 3, latestAt: '2026-11-17T10:00:00Z', readIndex: 1, lastReminderIndex: null as number | null };

describe('app email rules', () => {
  it('stops app emails from 24 November 2026 00:00 Paris time', () => {
    expect(appEmailsAllowed(new Date('2026-11-23T22:59:59Z'))).toBe(true);
    expect(appEmailsAllowed(new Date('2026-11-23T23:00:00Z'))).toBe(false);
  });
  it('defaults to French unless the profile is English', () => {
    expect(emailLang(undefined)).toBe('fr');
    expect(emailLang('en')).toBe('en');
  });
  it('waits five minutes before reminding', () => {
    expect(reminderDue({ ...base, now: new Date('2026-11-17T10:04:59Z') })).toBe(false);
    expect(reminderDue({ ...base, now: new Date('2026-11-17T10:05:00Z') })).toBe(true);
  });
  it('sends only one reminder until the recipient reads', () => {
    const now = new Date('2026-11-17T11:00:00Z');
    expect(reminderDue({ ...base, latestIndex: 5, lastReminderIndex: 3, now })).toBe(false);
    expect(reminderDue({ ...base, latestIndex: 5, readIndex: 3, lastReminderIndex: 3, now })).toBe(true);
  });
  it('never reminds about read messages or after closure', () => {
    expect(reminderDue({ ...base, readIndex: 3, now: new Date('2026-11-17T11:00:00Z') })).toBe(false);
    expect(reminderDue({ ...base, latestAt: '2026-11-23T22:00:00Z', now: new Date('2026-11-24T00:00:00Z') })).toBe(false);
  });
});
