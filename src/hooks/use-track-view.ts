import { useEffect } from 'react';
import { track, type AnalyticsEvents } from '@/lib/analytics';

// Guards against double-mounted effects (React dev StrictMode, remounts) sending the same view twice.
const recent = new Map<string, number>();

/** Fires a view event once per distinct props (client-only). Pass `enabled=false` until ids are known. */
export function useTrackView<E extends keyof AnalyticsEvents>(event: E, props?: AnalyticsEvents[E], enabled = true) {
  const key = JSON.stringify(props ?? {});
  useEffect(() => {
    if (!enabled) return;
    const id = `${event}:${key}`;
    const now = Date.now();
    if (now - (recent.get(id) ?? 0) < 1500) return;
    recent.set(id, now);
    (track as (e: E, p?: AnalyticsEvents[E]) => void)(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, key, enabled]);
}
