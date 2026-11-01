import { useEffect } from 'react';
import { track, type AnalyticsEvents } from '@/lib/analytics';

/** Fires a view event once per distinct props (client-only). Pass `enabled=false` until ids are known. */
export function useTrackView<E extends keyof AnalyticsEvents>(event: E, props?: AnalyticsEvents[E], enabled = true) {
  const key = JSON.stringify(props ?? {});
  useEffect(() => {
    if (!enabled) return;
    (track as (e: E, p?: AnalyticsEvents[E]) => void)(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, key, enabled]);
}
