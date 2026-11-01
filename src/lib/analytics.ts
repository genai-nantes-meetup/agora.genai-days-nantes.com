// Browser-only product analytics (PostHog). Every export is a silent no-op on the server
// and never throws: ad blockers, offline mode or proxy failures must not affect the app.
import type { PostHog } from 'posthog-js';

const TOKEN = 'phc_xUGbPmqmZkCb7M8Rmi7Baa93hEthKs6LQpnRdUipBuGy';

type Id = string;
type YesNo = 'yes' | 'no';
export type AnalyticsEvents = {
  invitation_opened: Record<string, never>;
  magic_link_requested: Record<string, never>;
  signed_in: Record<string, never>;
  signed_out: Record<string, never>;
  onboarding_step_completed: { step: number };
  onboarding_completed: Record<string, never>;
  profile_updated: { fields: string[] };
  profile_photo_uploaded: Record<string, never>;
  account_deleted: Record<string, never>;
  directory_viewed: Record<string, never>;
  directory_filter_changed: { filter: string; value: string };
  directory_ai_search_used: { fallback_used: YesNo; result_count: number };
  member_profile_viewed: { target_user_id: Id; target_status: string };
  linkedin_link_clicked: { target_user_id?: Id | undefined };
  connection_requested: { target_user_id: Id };
  connection_accepted: { request_id?: Id | undefined };
  connection_declined: { request_id?: Id | undefined };
  member_blocked: { target_user_id: Id };
  member_reported: { target_user_id: Id; reason?: string };
  conversation_opened: { conversation_id: Id };
  message_sent: { conversation_id: Id; is_reply: boolean; length_bucket: string; from_icebreaker: YesNo };
  message_send_failed: { conversation_id: Id };
  message_retried: { conversation_id: Id };
  message_edited: { conversation_id: Id };
  message_deleted: { conversation_id: Id };
  reaction_toggled: { conversation_id: Id; emoji: string; action: 'added' | 'removed' };
  icebreaker_shown: { conversation_id: Id; count: number };
  icebreaker_used: { conversation_id: Id };
  session_viewed: { session_id: Id };
  session_liked: { session_id: Id };
  session_unliked: { session_id: Id };
  program_filter_changed: { track: string };
  my_sessions_viewed: Record<string, never>;
  calendar_add_clicked: { session_id: Id; provider: 'ics' | 'google' | 'office365' };
  speaker_viewed: { speaker_id: Id };
  sponsor_viewed: { sponsor_id: Id; tier?: string | undefined };
  sponsor_link_clicked: { sponsor_id: Id; tier?: string | undefined };
  map_viewed: { floor: string };
  map_zoomed: { floor: string };
  session_feedback_submitted: { session_id: Id; checkboxes: string[]; has_text: YesNo };
  language_switched: { from: string; to: string };
  push_prompt_shown: Record<string, never>;
  push_permission_result: { result: 'granted' | 'denied' | 'dismissed' };
  pwa_install_prompt_shown: Record<string, never>;
  pwa_installed: Record<string, never>;
  offline_mode_entered: Record<string, never>;
  offline_mode_exited: Record<string, never>;
  push_notification_clicked: { type: string };
  email_link_clicked: { template: string };
  admin_viewed: Record<string, never>;
};

let ph: PostHog | null = null;
let superProps: Record<string, unknown> = {};
let loading: Promise<PostHog | null> | null = null;
const queue: Array<(p: PostHog) => void> = [];

function run(fn: (p: PostHog) => void) {
  if (typeof window === 'undefined') return;
  try {
    if (ph) fn(ph);
    else if (queue.length < 200) queue.push(fn);
  } catch { /* silent */ }
}

export function isStandalone(): boolean {
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch { return false; }
}

/** Call once from a client effect. */
export function initAnalytics(lang: string): Promise<PostHog | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (loading) return loading;
  loading = import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(TOKEN, {
        api_host: 'https://hogpost.naomakers.com',
        ui_host: 'https://us.posthog.com',
        persistence: 'cookie',
        autocapture: true,
        capture_pageview: 'history_change',
        capture_pageleave: true,
        disable_session_recording: true,
        capture_exceptions: true,
        mask_all_text: false,
        mask_all_element_attributes: false,
      });
      superProps = { lang, is_pwa_standalone: isStandalone(), app_version: import.meta.env['VITE_APP_VERSION'] ?? 'web' };
      posthog.register(superProps);
      ph = posthog;
      for (const fn of queue.splice(0)) { try { fn(posthog); } catch { /* silent */ } }
      return posthog;
    })
    .catch(() => null);
  return loading;
}

export function track<E extends keyof AnalyticsEvents>(event: E, ...props: AnalyticsEvents[E] extends Record<string, never> ? [] : [AnalyticsEvents[E]]) {
  run(p => p.capture(event, props[0] ?? {}));
}
export function identify(userId: string, props: Record<string, unknown>) {
  run(p => p.identify(userId, props));
}
export function setPersonProperties(props: Record<string, unknown>) {
  run(p => p.setPersonProperties(props));
}
export function registerSuper(props: Record<string, unknown>) {
  superProps = { ...superProps, ...props };
  run(p => p.register(props));
}
export function resetAnalytics() {
  run(p => { p.reset(); p.register(superProps); });
}
