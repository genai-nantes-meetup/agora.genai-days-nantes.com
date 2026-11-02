// Pure rules mapping sponsors.json entries to email domains. No React or browser globals.
export const GENERIC_DOMAINS = ['linkedin.com','gmail.com','googlemail.com','outlook.com','hotmail.com','live.com','yahoo.com','icloud.com','github.com','medium.com','facebook.com','instagram.com','x.com','twitter.com','youtube.com','notion.site','wixsite.com'];
export const SPONSOR_TIERS = ['platinum','gold','silver'] as const;
export type SponsorTier = typeof SPONSOR_TIERS[number];

/** Derives the email domain from a sponsor website, or null when missing, invalid or generic. */
export function domainFromWebsite(website: string | null | undefined): string | null {
  if (!website?.trim()) return null;
  let host: string;
  try { host = new URL(/^[a-z]+:\/\//i.test(website.trim()) ? website.trim() : `https://${website.trim()}`).hostname.toLowerCase(); }
  catch { return null; }
  host = host.replace(/\.$/, '');
  if (host.startsWith('www.')) host = host.slice(4);
  const labels = host.split('.');
  if (labels.length > 2 && /^[a-z]{2}$/.test(labels[0] ?? '')) labels.shift();
  host = labels.join('.');
  if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(host)) return null;
  if (GENERIC_DOMAINS.some(g => host === g || host.endsWith(`.${g}`))) return null;
  return host;
}

export type SponsorSource = { id: string; tier: string; website?: string | null | undefined; name?: string | undefined };
export type DesiredDomain = { domain: string; sponsor_id: string; tier: SponsorTier };

/** Domain rows the sync should own; first sponsor wins on a shared domain. */
export function desiredSponsorDomains(sponsors: SponsorSource[]): DesiredDomain[] {
  const out = new Map<string, DesiredDomain>();
  for (const s of sponsors) {
    if (!(SPONSOR_TIERS as readonly string[]).includes(s.tier)) continue;
    const domain = domainFromWebsite(s.website);
    if (domain && !out.has(domain)) out.set(domain, { domain, sponsor_id: s.id, tier: s.tier as SponsorTier });
  }
  return [...out.values()];
}
