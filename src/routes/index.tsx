import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { currentOrNext, parisNow, toMinutes, type Session } from "@/lib/event";
import { useSessions } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { useLikes } from "@/lib/likes";
import { ErrorView, LoadingView, OfflineDataNote, ProgramTabs } from "@/components/common";
import { SessionCard } from "@/components/SessionCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Programme · Hey GenAI Days" },
      { name: "description", content: "Le programme des GenAI Days du 17 novembre 2026 à Nantes : talks, keynotes et tables rondes." },
      { property: "og:title", content: "Programme · Hey GenAI Days" },
      { property: "og:description", content: "Toutes les sessions des GenAI Days, track Décideurs et track Tech." },
    ],
  }),
  component: ProgramPage,
});

type Filter = "all" | "decideurs" | "tech" | "mine";

function useParisClock() {
  const [now, setNow] = useState<{ date: string; minutes: number } | null>(null);
  useEffect(() => {
    const tick = () => setNow(parisNow());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function ProgramPage() {
  const { t } = useI18n();
  const { data, offlineAt, isPending, isError, refetch } = useSessions();
  const { likes, toggle } = useLikes();
  const [filter, setFilter] = useState<Filter>("all");
  const clock = useParisClock();
  const scrolled = useRef(false);

  const sessions = useMemo(
    () => [...(data?.sessions ?? [])].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)),
    [data],
  );

  const isEventDay = !!clock && !!data && clock.date === data.event.date;
  const nowInfo = useMemo(
    () => (isEventDay && clock ? currentOrNext(sessions, clock.minutes) : { ids: [], live: false }),
    [isEventDay, clock, sessions],
  );

  const filtered = useMemo(
    () =>
      sessions.filter((s) => {
        if (filter === "mine") return likes.includes(s.id);
        if (filter === "all") return true;
        return s.track === filter || s.track === "commun";
      }),
    [sessions, filter, likes],
  );

  const slots = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of filtered) map.set(s.startTime, [...(map.get(s.startTime) ?? []), s]);
    return [...map.entries()].map(([time, list]) => ({
      time,
      list: list.sort((a, b) => (a.track === "decideurs" ? -1 : b.track === "decideurs" ? 1 : 0)),
    }));
  }, [filtered]);

  useEffect(() => {
    if (scrolled.current || !isEventDay || !nowInfo.ids.length) return;
    scrolled.current = true;
    requestAnimationFrame(() =>
      document.getElementById(`s-${nowInfo.ids[0]}`)?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  }, [isEventDay, nowInfo]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("filter.all") },
    { id: "decideurs", label: t("track.decideurs") },
    { id: "tech", label: t("track.tech") },
    { id: "mine", label: `♥ ${t("filter.mine")}` },
  ];

  return (
    <div>
      <ProgramTabs active="program" />
      <OfflineDataNote at={offlineAt} />
      <div className="px-4 pt-5">
        <p className="font-label text-xs uppercase text-muted-foreground">{t("nav.program")} · 17.11.2026 · Nantes</p>
        <h1 className="mt-1 text-4xl font-extrabold leading-tight">GenAI Days</h1>
      </div>

      <div className="sticky top-14 z-20 -mt-1 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${filter === f.id ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <LoadingView />
      ) : isError || !data ? (
        <ErrorView onRetry={() => refetch()} />
      ) : filter === "mine" && !filtered.length ? (
        <p className="mx-4 mt-4 rounded-xl bg-surface p-6 text-center text-sm text-muted-foreground">{t("mine.empty")}</p>
      ) : (
        <ol className="space-y-6 px-4 pt-2">
          {slots.map(({ time, list }) => (
            <li key={time} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3">
              <div className="font-label pt-3 text-sm">{time}</div>
              <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 ${list.length > 1 ? "sm:grid-cols-[repeat(2,minmax(0,1fr))]" : ""}`}>
                {list.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    liked={likes.includes(s.id)}
                    onLike={() => toggle(s, sessions)}
                    now={nowInfo.ids.includes(s.id) ? (nowInfo.live ? "live" : "next") : undefined}
                  />
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
