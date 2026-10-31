import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useI18n } from "./i18n";
import type { SessionsPayload, SpeakersPayload, SponsorsPayload } from "./event";

const BASE = "https://genai-days-nantes.com/api";
const TIMEOUT_MS = 4000;
const STORE_PREFIX = "hey-genai:data:";

export type Loaded<T> = { payload: T; offlineAt: number | null };

/**
 * Network-first: always hit the network (no HTTP cache). On failure or after ~4s,
 * fall back to the last copy saved on this device and report when it was saved.
 */
async function getJson<T>(url: string): Promise<Loaded<T>> {
  const key = STORE_PREFIX + url;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = (await res.json()) as T;
    try {
      localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), payload }));
    } catch {
      /* quota: ignore */
    }
    return { payload, offlineAt: null };
  } catch (err) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const { savedAt, payload } = JSON.parse(raw) as { savedAt: number; payload: T };
        return { payload, offlineAt: savedAt };
      }
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function useEventData<T>(name: "sessions" | "speakers" | "sponsors") {
  const { lang } = useI18n();
  const q = useQuery({
    queryKey: [name, lang],
    queryFn: () => getJson<T>(`${BASE}/${lang}/${name}.json`),
    staleTime: 0,
    retry: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: true, // fires on visibilitychange
    refetchOnReconnect: true,
    placeholderData: keepPreviousData, // no flash when switching language
  });
  return {
    data: q.data?.payload,
    offlineAt: q.data?.offlineAt ?? null,
    isPending: q.isPending,
    isError: q.isError && !q.data,
    refetch: q.refetch,
  };
}

export const useSessions = () => useEventData<SessionsPayload>("sessions");
export const useSpeakers = () => useEventData<SpeakersPayload>("speakers");
export const useSponsors = () => useEventData<SponsorsPayload>("sponsors");
