// Pure event helpers (no React, no browser globals) — covered by event.test.ts.

export type Track = "decideurs" | "tech" | "commun";
export type Format = "talk" | "keynote" | "table-ronde" | "concours" | "podcast";

export interface SessionSpeakerRef {
  id: string;
  name: string;
  pageUrl?: string;
}

export interface Session {
  id: string;
  kind?: "session" | "break" | "lunch";
  title: string;
  subtitle?: string | null;
  description?: string | null;
  format: Format | string | null;
  track: Track | string;
  startTime: string;
  durationMinutes: number;
  room: string | null;
  themes?: string[];
  speakers?: SessionSpeakerRef[];
  image?: string | null;
  pageUrl?: string;
}

export interface EventInfo {
  name: string;
  date: string;
  startTime?: string;
  endTime?: string;
  timezone: string;
}

export interface SessionsPayload {
  event: EventInfo;
  sessions: Session[];
}

export interface Speaker {
  id: string;
  name: string;
  role?: string | null;
  company?: string | null;
  eventRole?: string | null;
  bio?: string | null;
  profile?: string[];
  genaiLegitimacy?: string | null;
  careerHighlights?: { period?: string; title?: string; description?: string }[];
  companies?: { name: string; relationship?: string; description?: string; website?: string }[];
  photo?: string | null;
  links?: { linkedin?: string | null; website?: string | null; x?: string | null };
  sessions?: unknown[];
  pageUrl?: string;
}

export interface SpeakersPayload {
  speakers: Speaker[];
}

export const VENUE = "Hôtel de Région Pays de la Loire, 1 rue de la Loire, 44200 Nantes";

export type Floor = "rdc" | "f1" | null;

/** Room rule: an explicit room wins; otherwise tech → Salle Loire (RDC), decideurs → Hémicycle (1er). */
export function resolveRoom(s: Pick<Session, "room" | "track">): { room: string | null; floor: Floor } {
  if (s.room) return { room: s.room, floor: null };
  if (s.track === "tech") return { room: "Salle Loire", floor: "rdc" };
  if (s.track === "decideurs") return { room: "Hémicycle", floor: "f1" };
  return { room: null, floor: null };
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function fromMinutes(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function endTime(s: Pick<Session, "startTime" | "durationMinutes">): string {
  return fromMinutes(toMinutes(s.startTime) + (s.durationMinutes || 0));
}

export function overlaps(
  a: Pick<Session, "startTime" | "durationMinutes">,
  b: Pick<Session, "startTime" | "durationMinutes">,
): boolean {
  const as = toMinutes(a.startTime);
  const bs = toMinutes(b.startTime);
  return as < bs + b.durationMinutes && bs < as + a.durationMinutes;
}

/** Current Paris date (YYYY-MM-DD) and minutes since midnight. */
export function parisNow(d: Date = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** Sessions running now, or else the next ones to start. Empty when the day is over. */
export function currentOrNext(sessions: Session[], nowMin: number): { ids: string[]; live: boolean } {
  const live = sessions.filter((s) => {
    const st = toMinutes(s.startTime);
    return st <= nowMin && nowMin < st + s.durationMinutes;
  });
  if (live.length) return { ids: live.map((s) => s.id), live: true };
  const upcoming = sessions.filter((s) => toMinutes(s.startTime) > nowMin);
  if (!upcoming.length) return { ids: [], live: false };
  const first = Math.min(...upcoming.map((s) => toMinutes(s.startTime)));
  return { ids: upcoming.filter((s) => toMinutes(s.startTime) === first).map((s) => s.id), live: false };
}

function compact(date: string, hhmm: string) {
  return `${date.replaceAll("-", "")}T${hhmm.replace(":", "")}00`;
}

function icsEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Paris",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function roomLine(s: Session, roomLabel: string, floorLabel?: string | null) {
  const { room } = resolveRoom(s);
  return room ? `${roomLabel} : ${room}${floorLabel ? ` (${floorLabel})` : ""}` : "";
}

/** Builds an .ics file in Paris time. `roomText` is the localized "Salle : X (étage)" line. */
export function buildIcs(s: Session, date: string, roomText: string, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const desc = [roomText, s.subtitle, s.pageUrl].filter(Boolean).join("\n\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GenAI Days//Hey GenAI Days//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE,
    "BEGIN:VEVENT",
    `UID:${s.id}@hey.genai-days-nantes.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Europe/Paris:${compact(date, s.startTime)}`,
    `DTEND;TZID=Europe/Paris:${compact(date, endTime(s))}`,
    `SUMMARY:${icsEscape(`${s.title} · GenAI Days`)}`,
    `LOCATION:${icsEscape(VENUE)}`,
    `DESCRIPTION:${icsEscape(desc)}`,
    s.pageUrl ? `URL:${s.pageUrl}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n") + "\r\n";
}

export function googleCalendarUrl(s: Session, date: string, roomText: string): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `${s.title} · GenAI Days`,
    dates: `${compact(date, s.startTime)}/${compact(date, endTime(s))}`,
    ctz: "Europe/Paris",
    location: VENUE,
    details: [roomText, s.subtitle, s.pageUrl].filter(Boolean).join("\n\n"),
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export type SponsorTier = "platinum" | "gold" | "silver";
export interface Sponsor {
  id: string;
  name: string;
  tier: SponsorTier | string;
  coOrganizer?: boolean;
  description?: string | null;
  website?: string | null;
  logo?: string | null;
  pageUrl?: string | null;
}
export interface SponsorsPayload {
  event: EventInfo;
  count: number;
  sponsors: Sponsor[];
}

export const SPONSOR_TIERS: SponsorTier[] = ["platinum", "gold", "silver"];

/** Groups sponsors by tier in Platinum, Gold, Silver order; unknown tiers are dropped. */
export function groupSponsors(list: Sponsor[]): { tier: SponsorTier; sponsors: Sponsor[] }[] {
  return SPONSOR_TIERS.map((tier) => ({ tier, sponsors: list.filter((s) => s.tier === tier) })).filter(
    (g) => g.sponsors.length > 0,
  );
}
