// Server-only app email triggers. Every send is claimed in the database first so it happens once.
import { APP_URL, appEmailsAllowed, emailLang, reminderDue } from './emails';

async function admin() {
  return (await import('@/integrations/supabase/client.server')).supabaseAdmin;
}
async function send(template: string, to: string, templateData: Record<string, unknown>, idempotencyKey: string) {
  const { sendTemplateEmail } = await import('./email-templates/send-email');
  return sendTemplateEmail(template, to, { templateData, idempotencyKey });
}

/** Sends one invitation. Without `resend`, an invitation already sent is never sent again. */
export async function sendInvitation(id: string, opts: { resend?: boolean } = {}) {
  if (!appEmailsAllowed()) return { sent: false as const, reason: 'closed' };
  const db = await admin();
  const now = new Date().toISOString();
  let q = db.from('invitations').update({ invitation_sent_at: now }).eq('id', id);
  if (!opts.resend) q = q.is('invitation_sent_at', null);
  const { data: inv, error } = await q.select('id,email,first_name,token,invitation_sent_at').maybeSingle();
  if (error) throw new Error('Unavailable');
  if (!inv) return { sent: false as const, reason: 'already_sent' };
  try {
    const r = await send('invitation', inv.email, { lang: 'fr', firstName: inv.first_name || undefined, url: `${APP_URL}/join?token=${inv.token}` }, `invitation-${inv.id}-${opts.resend ? now : 'first'}`);
    return r.sent ? { sent: true as const } : { sent: false as const, reason: r.reason };
  } catch (e) {
    if (!opts.resend) await db.from('invitations').update({ invitation_sent_at: null }).eq('id', id).eq('invitation_sent_at', now);
    throw e;
  }
}

export async function sendUnsentInvitations() {
  const db = await admin();
  const { data, error } = await db.from('invitations').select('id').is('invitation_sent_at', null).limit(1000);
  if (error) throw new Error('Unavailable');
  let sent = 0, failed = 0;
  const ids = data.map(r => r.id);
  for (let i = 0; i < ids.length; i += 5) {
    const results = await Promise.allSettled(ids.slice(i, i + 5).map(id => sendInvitation(id)));
    for (const r of results) r.status === 'fulfilled' && r.value.sent ? sent++ : failed++;
  }
  return { sent, failed };
}

export async function autoSendLateInvitation(email: string) {
  const db = await admin();
  const { data: s } = await db.from('email_settings').select('auto_send_late_invites').eq('id', true).maybeSingle();
  if (!s?.auto_send_late_invites) return;
  const { data: inv } = await db.from('invitations').select('id,used_at').eq('email', email.toLowerCase()).maybeSingle();
  if (inv && !inv.used_at) await sendInvitation(inv.id);
}

async function names(ids: string[]) {
  const db = await admin();
  const { data } = await db.from('profiles').select('user_id,email,first_name,last_name,lang').in('user_id', ids);
  return (id: string) => data?.find(p => p.user_id === id);
}

export async function emailConnectionRequest(id: string) {
  if (!appEmailsAllowed()) return;
  const db = await admin();
  const now = new Date().toISOString();
  const { data: r } = await db.from('connection_requests').update({ request_email_sent_at: now }).eq('id', id).eq('status', 'pending').is('cancelled_at', null).is('request_email_sent_at', null).select('*').maybeSingle();
  if (!r) return;
  const get = await names([r.requester_id, r.recipient_id]);
  const sender = get(r.requester_id), recipient = get(r.recipient_id);
  if (!sender || !recipient) return;
  try {
    await send('connection-request', recipient.email, { lang: emailLang(recipient.lang), senderName: `${sender.first_name} ${sender.last_name}`.trim(), url: `${APP_URL}/messages` }, `connection-request-${r.id}`);
  } catch (e) {
    await db.from('connection_requests').update({ request_email_sent_at: null }).eq('id', id).eq('request_email_sent_at', now);
    throw e;
  }
}

export async function emailConnectionAccepted(requestId: string, conversationId: string) {
  if (!appEmailsAllowed()) return;
  const db = await admin();
  const now = new Date().toISOString();
  const { data: r } = await db.from('connection_requests').update({ accepted_email_sent_at: now }).eq('id', requestId).eq('status', 'accepted').is('accepted_email_sent_at', null).select('*').maybeSingle();
  if (!r) return;
  const get = await names([r.requester_id, r.recipient_id]);
  const requester = get(r.requester_id), accepter = get(r.recipient_id);
  if (!requester || !accepter) return;
  try {
    await send('connection-accepted', requester.email, { lang: emailLang(requester.lang), recipientName: `${accepter.first_name} ${accepter.last_name}`.trim(), url: `${APP_URL}/messages/${conversationId}` }, `connection-accepted-${r.id}`);
  } catch (e) {
    await db.from('connection_requests').update({ accepted_email_sent_at: null }).eq('id', requestId).eq('accepted_email_sent_at', now);
    throw e;
  }
}

/**
 * Unread reminders: needs Twilio read horizons. If Twilio is unavailable, the conversation is skipped
 * (never emailed blindly) and retried on the next run.
 */
export async function runUnreadReminders(limit = 50) {
  if (!appEmailsAllowed()) return { sent: 0, skipped: 0 };
  const db = await admin();
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: events } = await db.from('message_events').select('conversation_id,recipient_id,sender_id,message_index,created_at').lte('created_at', cutoff).gte('created_at', new Date(Date.now() - 48 * 3600 * 1000).toISOString()).order('message_index', { ascending: false }).limit(500);
  const latest = new Map<string, NonNullable<typeof events>[number]>();
  for (const e of events ?? []) { const k = `${e.conversation_id}:${e.recipient_id}`; if (!latest.has(k)) latest.set(k, e); }
  let sent = 0, skipped = 0;
  for (const e of [...latest.values()].slice(0, limit)) {
    const { data: c } = await db.from('conversations').select('*').eq('id', e.conversation_id).maybeSingle();
    const { data: rc } = await db.from('conversation_receipts').select('*').eq('conversation_id', e.conversation_id).eq('user_id', e.recipient_id).maybeSingle();
    if (!c || c.closed_at || !c.conversation_sid || !rc) { skipped++; continue; }
    if (rc.last_reminder_index !== null && rc.read_index < rc.last_reminder_index) {
      // Pending reminder: refresh the read horizon only.
    }
    let readIndex = rc.read_index;
    try {
      const participant = c.user_a === e.recipient_id ? c.participant_a_sid : c.participant_b_sid;
      if (!participant) throw new Error('NoParticipant');
      const { readHorizon } = await import('./twilio.server');
      readIndex = await readHorizon(c.conversation_sid, participant);
      if (readIndex !== rc.read_index) await db.from('conversation_receipts').update({ read_index: readIndex }).eq('conversation_id', c.id).eq('user_id', e.recipient_id);
    } catch { skipped++; continue; }
    if (!reminderDue({ latestIndex: e.message_index, latestAt: e.created_at, readIndex, lastReminderIndex: rc.last_reminder_index })) continue;
    let claim = db.from('conversation_receipts').update({ last_reminder_index: e.message_index }).eq('conversation_id', c.id).eq('user_id', e.recipient_id);
    claim = rc.last_reminder_index === null ? claim.is('last_reminder_index', null) : claim.eq('last_reminder_index', rc.last_reminder_index);
    const { data: won } = await claim.select('conversation_id').maybeSingle();
    if (!won) continue;
    const get = await names([e.sender_id, e.recipient_id]);
    const sender = get(e.sender_id), recipient = get(e.recipient_id);
    if (!sender || !recipient) continue;
    try {
      await send('unread-reminder', recipient.email, { lang: emailLang(recipient.lang), senderName: `${sender.first_name} ${sender.last_name}`.trim(), url: `${APP_URL}/messages/${c.id}` }, `unread-reminder-${c.id}-${e.recipient_id}-${e.message_index}`);
      sent++;
    } catch {
      await db.from('conversation_receipts').update({ last_reminder_index: rc.last_reminder_index }).eq('conversation_id', c.id).eq('user_id', e.recipient_id).eq('last_reminder_index', e.message_index);
    }
  }
  return { sent, skipped };
}
