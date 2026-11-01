// Pure analytics helpers: no browser globals, no React. Tested in analytics-rules.test.ts.

export type AnalyticsStatus = 'speaker' | 'sponsor_platinum' | 'sponsor_gold' | 'sponsor_silver' | 'participant' | 'organizer';

export function analyticsStatus(s: { is_organizer?: boolean; is_speaker?: boolean; sponsor_tier?: string | null } | null | undefined): AnalyticsStatus {
  if (s?.is_organizer) return 'organizer';
  if (s?.is_speaker) return 'speaker';
  if (s?.sponsor_tier === 'platinum' || s?.sponsor_tier === 'gold' || s?.sponsor_tier === 'silver') return `sponsor_${s.sponsor_tier}`;
  return 'participant';
}

export type LengthBucket = '1-20' | '21-100' | '101-500' | '500+';
export function lengthBucket(n: number): LengthBucket {
  if (n <= 20) return '1-20';
  if (n <= 100) return '21-100';
  if (n <= 500) return '101-500';
  return '500+';
}

// Profile fields allowed in person properties. Free text (pitch, job_title, company, linkedin) is never sent.
export function personProperties(p: Record<string, unknown> | null | undefined, status: AnalyticsStatus) {
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const str = (v: unknown) => (typeof v === 'string' && v ? v : null);
  return {
    email: str(p?.['email']), first_name: str(p?.['first_name']), last_name: str(p?.['last_name']), status,
    job_tags: arr(p?.['job_tags']), intentions: arr(p?.['intentions']), ai_level: str(p?.['ai_level']),
    company_size: str(p?.['company_size']), sector: str(p?.['sector']), city: str(p?.['city']), lang: str(p?.['lang']),
  };
}

// Returns names of changed fields only, never values.
export function changedFieldNames(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  return Object.keys(after).filter(k => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null)).sort();
}

const EMAIL_TEMPLATES = ['invitation', 'connection-request', 'connection-accepted', 'unread-digest'] as const;
const PUSH_TYPES = ['message', 'connection_request'] as const;
/** Reads attribution params; returns only known enum values. */
export function readAttribution(search: string): { email?: (typeof EMAIL_TEMPLATES)[number]; push?: (typeof PUSH_TYPES)[number] } {
  const q = new URLSearchParams(search);
  const out: ReturnType<typeof readAttribution> = {};
  const c = q.get('utm_campaign');
  if (q.get('utm_source') === 'email' && c && (EMAIL_TEMPLATES as readonly string[]).includes(c)) out.email = c as (typeof EMAIL_TEMPLATES)[number];
  const p = q.get('from_push');
  if (p && (PUSH_TYPES as readonly string[]).includes(p)) out.push = p as (typeof PUSH_TYPES)[number];
  return out;
}
export const ATTRIBUTION_PARAMS = ['utm_source', 'utm_campaign', 'from_push'];
