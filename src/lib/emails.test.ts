import { describe, expect, it } from 'vitest';
import { appEmailsAllowed, emailLang } from './emails';


describe('app email rules', () => {
  it('stops app emails from 24 November 2026 00:00 Paris time', () => {
    expect(appEmailsAllowed(new Date('2026-11-23T22:59:59Z'))).toBe(true);
    expect(appEmailsAllowed(new Date('2026-11-23T23:00:00Z'))).toBe(false);
  });
  it('defaults to French unless the profile is English', () => {
    expect(emailLang(undefined)).toBe('fr');
    expect(emailLang('en')).toBe('en');
  });
});
