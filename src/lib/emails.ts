import { MESSAGING_CLOSES_AT } from './messaging';

/** App emails stop when messaging becomes read-only (24 Nov 2026, 00:00 Paris). Auth emails are unaffected. */
export const APP_EMAILS_CLOSE_AT = MESSAGING_CLOSES_AT;
export const APP_URL = 'https://agora.genai-days-nantes.com';

export function appEmailsAllowed(now = new Date()) {
  return now.getTime() < Date.parse(APP_EMAILS_CLOSE_AT);
}

export type EmailLang = 'fr' | 'en';
export function emailLang(value: unknown): EmailLang {
  return value === 'en' ? 'en' : 'fr';
}
