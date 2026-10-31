import { useQuery } from "@tanstack/react-query";
import { useI18n } from "./i18n";
import type { SessionsPayload, SpeakersPayload } from "./event";

const BASE = "https://genai-days-nantes.com/api";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

const opts = { staleTime: 5 * 60_000, retry: 2, refetchOnWindowFocus: true } as const;

export function useSessions() {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ["sessions", lang],
    queryFn: () => getJson<SessionsPayload>(`${BASE}/${lang}/sessions.json`),
    ...opts,
  });
}

export function useSpeakers() {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ["speakers", lang],
    queryFn: () => getJson<SpeakersPayload>(`${BASE}/${lang}/speakers.json`),
    ...opts,
  });
}

