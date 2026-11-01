// Server-only app email triggers. Every send is claimed in the database first so it happens once.
import { APP_URL, appEmailsAllowed, emailLang } from './emails';
import { selectDigests, type DigestCandidate } from './messaging';

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
    const r = await send('invitation', inv.email, { lang: 'fr', firstName: inv.first_name || undefined, url: `${APP_URL}/join?token=${inv.token}&utm_source=email&utm_campaign=invitation` }, `invitation-${inv.id}-${opts.resend ? now : 'first'}`);
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
    await send('connection-request', recipient.email, { lang: emailLang(recipient.lang), senderName: `${sender.first_name} ${sender.last_name}`.trim(), url: `${APP_URL}/messages?utm_source=email&utm_campaign=connection-request` }, `connection-request-${r.id}`);
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
    await send('connection-accepted', requester.email, { lang: emailLang(requester.lang), recipientName: `${accepter.first_name} ${accepter.last_name}`.trim(), url: `${APP_URL}/messages/${conversationId}?utm_source=email&utm_campaign=connection-accepted` }, `connection-accepted-${r.id}`);
  } catch (e) {
    await db.from('connection_requests').update({ accepted_email_sent_at: null }).eq('id', requestId).eq('accepted_email_sent_at', now);
    throw e;
  }
}

/**
 * Unread digest: one email per recipient at most every 30 minutes, listing conversations with messages
 * unread for 30 minutes (sender names and counts only). Claimed atomically in the database first.
 */
export async function runUnreadDigests(limit = 50) {
  if (!appEmailsAllowed()) return { sent: 0, skipped: 0 };
  const db = await admin();
  const { data, error } = await db.rpc('digest_candidates');
  if (error) throw new Error('Unavailable');
  const due = selectDigests((data ?? []) as DigestCandidate[]);
  let sent = 0, skipped = 0;
  for (const [recipientId, rows] of [...due.entries()].slice(0, limit)) {
    const ids = rows.map(r => r.conversation_id);
    const { data: previous, error: claimError } = await db.rpc('claim_digest', { p_user: recipientId, p_conversations: ids });
    if (claimError) { skipped++; continue; } // NotDue: another run already sent it.
    const get = await names([recipientId, ...rows.map(r => r.sender_id)]);
    const recipient = get(recipientId);
    if (!recipient) { skipped++; continue; }
    const items = rows.map(r => { const s = get(r.sender_id); return { senderName: s ? `${s.first_name} ${s.last_name}`.trim() : undefined, unread: r.unread }; });
    try {
      await send('unread-digest', recipient.email, { lang: emailLang(recipient.lang), items, url: `${APP_URL}/messages?utm_source=email&utm_campaign=unread-digest` }, `unread-digest-${recipientId}-${new Date().toISOString().slice(0, 16)}`);
      sent++;
    } catch {
      // Release the claim so the next run retries.
      await db.from('message_digests').update({ last_sent_at: previous }).eq('user_id', recipientId);
      await db.from('conversation_receipts').update({ digested_at: null }).eq('user_id', recipientId).in('conversation_id', ids);
      skipped++;
    }
  }
  return { sent, skipped };
}
