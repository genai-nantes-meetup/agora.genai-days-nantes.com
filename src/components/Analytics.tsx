import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { identify, initAnalytics, isStandalone, registerSuper, resetAnalytics, track } from '@/lib/analytics';
import { analyticsStatus, ATTRIBUTION_PARAMS, personProperties, readAttribution } from '@/lib/analytics-rules';

/** Loads the person properties for the signed-in user and identifies them. Safe to call after profile edits. */
export async function identifyCurrentUser(userId: string) {
  try {
    const { data } = await supabase.from('profiles').select('*,profile_status(*)').eq('user_id', userId).maybeSingle();
    const row = (data ?? null) as (Record<string, unknown> & { profile_status?: Parameters<typeof analyticsStatus>[0] }) | null;
    let pushEnabled = false;
    try { pushEnabled = typeof Notification !== 'undefined' && Notification.permission === 'granted'; } catch { /* ignore */ }
    identify(userId, { ...personProperties(row, analyticsStatus(row?.profile_status)), pwa_installed: isStandalone(), push_enabled: pushEnabled });
  } catch { /* silent */ }
}

/** Client-only analytics bootstrap; renders nothing. */
export function Analytics() {
  const { user, ready } = useAuth();
  const { lang } = useI18n();
  const prevUser = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    void initAnalytics(lang);
    try {
      const attr = readAttribution(window.location.search);
      if (attr.email) track('email_link_clicked', { template: attr.email });
      if (attr.push) track('push_notification_clicked', { type: attr.push });
      if (attr.email || attr.push) {
        const url = new URL(window.location.href);
        ATTRIBUTION_PARAMS.forEach(k => url.searchParams.delete(k));
        window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
      }
      const off = () => track('offline_mode_entered');
      const on = () => track('offline_mode_exited');
      const installed = () => { track('pwa_installed'); registerSuper({ is_pwa_standalone: true }); };
      window.addEventListener('offline', off);
      window.addEventListener('online', on);
      window.addEventListener('appinstalled', installed);
      return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on); window.removeEventListener('appinstalled', installed); };
    } catch { return undefined; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { registerSuper({ lang }); }, [lang]);

  useEffect(() => {
    if (!ready) return;
    const id = user?.id ?? null;
    const prev = prevUser.current;
    prevUser.current = id;
    if (id && id !== prev) {
      void identifyCurrentUser(id);
      if (prev === null) track('signed_in');
    } else if (!id && prev) {
      track('signed_out');
      resetAnalytics();
    }
  }, [user, ready]);

  return null;
}
