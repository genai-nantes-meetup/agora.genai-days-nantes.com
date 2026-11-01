// Pure messaging rules: no React, no browser globals. Mirrored server-side in the database RPCs.
export const MESSAGING_CLOSES_AT = '2026-11-24T00:00:00+01:00';
export function messagingReadOnly(now = new Date()): boolean {
  return now.getTime() >= Date.parse(MESSAGING_CLOSES_AT);
}
export function pairKey(a: string, b: string): string { return [a, b].sort().join(':'); }
export type ConnectionState = 'none' | 'sent' | 'received' | 'connected' | 'blocked';
export function connectionState(request: {requester_id:string;status:string;cancelled_at:string|null}|undefined, uid:string):ConnectionState {
  if (!request) return 'none';
  if (request.cancelled_at) return 'blocked';
  if (request.status === 'accepted') return 'connected';
  if (request.requester_id === uid) return 'sent';
  return request.status === 'pending' ? 'received' : 'none';
}

export const MESSAGE_MAX = 1600;
export const PAGE_SIZE = 50;
export const EDIT_WINDOW_MS = 15 * 60 * 1000;
export const SEND_RETRY_GIVE_UP_MS = 30 * 1000;
export const TYPING_TTL_MS = 5000;
export const HEARTBEAT_MS = 20 * 1000;
export const PRESENCE_FRESH_MS = 30 * 1000;
export const DIGEST_DELAY_MS = 30 * 60 * 1000;
export const DIGEST_INTERVAL_MS = 30 * 60 * 1000;
export const REACTIONS = ['👍', '❤️', '😂', '😮', '🙏', '🔥'] as const;
export type Reaction = (typeof REACTIONS)[number];
export function isReaction(value: string): value is Reaction { return (REACTIONS as readonly string[]).includes(value); }

export type ChatMessage = {
  id: string; conversation_id: string; sender_id: string; body: string; reply_to_id: string | null;
  created_at: string; edited_at: string | null; deleted_at: string | null;
};

export function validBody(body: string): boolean { const b = body.trim(); return b.length >= 1 && b.length <= MESSAGE_MAX; }

/** Own messages can be edited or deleted for 15 minutes after creation. */
export function canModifyMessage(m: Pick<ChatMessage, 'sender_id' | 'created_at' | 'deleted_at'>, uid: string, now = new Date()): boolean {
  return m.sender_id === uid && !m.deleted_at && now.getTime() - Date.parse(m.created_at) < EDIT_WINDOW_MS && !messagingReadOnly(now);
}

/** Idempotent merge: a message id appears once; the newest server version wins; sorted by creation time. */
export function mergeMessages<T extends Pick<ChatMessage, 'id' | 'created_at'> & { edited_at?: string | null; deleted_at?: string | null }>(current: T[], incoming: T[]): T[] {
  const map = new Map(current.map(m => [m.id, m]));
  for (const m of incoming) {
    const old = map.get(m.id);
    if (!old) { map.set(m.id, m); continue; }
    const rank = (x: T) => (x.deleted_at ? 2 : 0) + (x.edited_at ? Date.parse(x.edited_at) / 1e13 : 0);
    if (rank(m) >= rank(old)) map.set(m.id, { ...old, ...m });
  }
  return [...map.values()].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id));
}

/** Skip the push when the recipient has the conversation open (heartbeat within 30 s). */
export function pushSuppressed(lastSeenAt: string | null | undefined, now = new Date()): boolean {
  return !!lastSeenAt && now.getTime() - Date.parse(lastSeenAt) < PRESENCE_FRESH_MS;
}

export type DigestCandidate = {
  recipient_id: string; conversation_id: string; sender_id: string; unread: number;
  oldest_unread_at: string; last_read_at: string | null; digested_at: string | null; last_digest_at: string | null;
};
/** A conversation qualifies when a message is unread for 30 min and it was not digested since the recipient last read it. */
export function conversationDigestDue(c: DigestCandidate, now = new Date()): boolean {
  if (c.unread < 1) return false;
  if (now.getTime() - Date.parse(c.oldest_unread_at) < DIGEST_DELAY_MS) return false;
  if (!c.digested_at) return true;
  return !!c.last_read_at && Date.parse(c.last_read_at) > Date.parse(c.digested_at);
}
/** At most one digest per recipient every 30 minutes. */
export function recipientDigestDue(lastDigestAt: string | null, now = new Date()): boolean {
  return !lastDigestAt || now.getTime() - Date.parse(lastDigestAt) >= DIGEST_INTERVAL_MS;
}
export function selectDigests(rows: DigestCandidate[], now = new Date()): Map<string, DigestCandidate[]> {
  const out = new Map<string, DigestCandidate[]>();
  if (messagingReadOnly(now)) return out;
  for (const r of rows) {
    if (!recipientDigestDue(r.last_digest_at, now) || !conversationDigestDue(r, now)) continue;
    out.set(r.recipient_id, [...(out.get(r.recipient_id) ?? []), r]);
  }
  return out;
}

/** Day key in Paris time for date separators. */
export function dayKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
}
/** Consecutive messages from the same sender within 5 minutes share a bubble group. */
export function sameGroup(a: Pick<ChatMessage, 'sender_id' | 'created_at'> | undefined, b: Pick<ChatMessage, 'sender_id' | 'created_at'>): boolean {
  return !!a && a.sender_id === b.sender_id && Date.parse(b.created_at) - Date.parse(a.created_at) < 5 * 60 * 1000 && dayKey(a.created_at) === dayKey(b.created_at);
}
