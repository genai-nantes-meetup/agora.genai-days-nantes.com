import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Clock, ExternalLink, MapPin } from "lucide-react";
import { endTime, resolveRoom } from "@/lib/event";
import { useSessions, useSpeakers } from "@/lib/data";
import { useI18n, type TKey } from "@/lib/i18n";
import { useLikes } from "@/lib/likes";
import { BackLink, ErrorView, LikeButton, LoadingView, TrackTag } from "@/components/common";
import { CalendarButtons } from "@/components/CalendarButtons";

export const Route = createFileRoute("/sessions/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Session · Hey GenAI Days" },
      { name: "description", content: "Détail d'une session des GenAI Days : horaire, salle, speakers." },
      { property: "og:title", content: "Session · Hey GenAI Days" },
      { property: "og:description", content: "Horaire, salle et speakers de cette session des GenAI Days." },
    ],
  }),
  component: SessionPage,
});

function SessionPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const { data, isPending, isError, refetch } = useSessions();
  const { data: sp } = useSpeakers();
  const { likes, toggle } = useLikes();

  if (isPending) return <LoadingView />;
  if (isError || !data) return <ErrorView onRetry={() => refetch()} />;
  const s = data.sessions.find((x) => x.id === id);
  if (!s) return <p className="p-6 text-center">{t("notFound")}</p>;

  const { room, floor } = resolveRoom(s);
  const speakers = s.speakers ?? [];
  const liked = likes.includes(s.id);

  return (
    <article className="pb-6">
      <div className="px-4 pt-4">
        <BackLink />
      </div>
      {s.image && (
        <img src={s.image} alt="" className="mt-3 aspect-[16/9] w-full object-cover sm:rounded-xl" loading="eager" />
      )}
      <div className="space-y-5 px-4 pt-5">
        <div className="grain relative overflow-hidden rounded-2xl border-2 border-foreground/80 bg-card p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <TrackTag track={s.track} />
              <span className="font-label text-xs uppercase text-muted-foreground">{t(`format.${s.format}` as TKey)}</span>
            </div>
            <LikeButton size="lg" liked={liked} onClick={() => toggle(s, data.sessions)} />
          </div>
          {speakers.length > 0 && (
            <p className="mt-1 font-display text-2xl font-extrabold leading-tight">{speakers.map((x) => x.name).join(", ")}</p>
          )}
          <h1 className="mt-2 text-2xl font-semibold italic leading-snug">{s.title}</h1>
          {s.subtitle && <p className="mt-1 text-muted-foreground">{s.subtitle}</p>}
          <div aria-hidden className="relative -mx-4 my-4 border-t-2 border-dashed border-foreground/30">
            <span className="absolute -left-3 -top-3 size-6 rounded-full bg-background" />
            <span className="absolute -right-3 -top-3 size-6 rounded-full bg-background" />
          </div>
          <dl className="grid gap-2 text-sm">
            <div className="flex items-center gap-2 font-bold">
              <Clock className="size-4" />
              <dt className="sr-only">{t("cal.add")}</dt>
              <dd>
                {t("date.event")} · <span className="font-label font-normal">{s.startTime}–{endTime(s)}</span>{" "}
                <span className="font-normal text-muted-foreground">({t("minutes", { n: s.durationMinutes })})</span>
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4" />
              <dt className="sr-only">{t("cal.room")}</dt>
              <dd className="font-label">
                {room ?? t("room.tbc")}
                {floor ? ` · ${t(`floor.${floor}`)}` : ""}
              </dd>
            </div>
          </dl>
        </div>

        <CalendarButtons session={s} date={data.event.date} />

        {s.description && <p className="whitespace-pre-line leading-relaxed">{s.description}</p>}

        {!!s.themes?.length && (
          <section>
            <h2 className="font-label text-xs uppercase text-muted-foreground">{t("themes")}</h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {s.themes.map((th) => (
                <li key={th} className="font-label rounded-full border bg-card px-2.5 py-1 text-xs">{th}</li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="font-label text-xs uppercase text-muted-foreground">{t("speakers")}</h2>
          {speakers.length ? (
            <ul className="mt-2 divide-y overflow-hidden rounded-xl bg-card shadow-card">
              {speakers.map((ref) => {
                const full = sp?.speakers.find((x) => x.id === ref.id);
                return (
                  <li key={ref.id}>
                    <Link to="/speakers/$id" params={{ id: ref.id }} className="flex items-center gap-3 p-3">
                      {full?.photo ? (
                        <img src={full.photo} alt="" loading="lazy" className="size-12 rounded-full object-cover" />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-full bg-surface font-display text-lg">{ref.name[0]}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{ref.name}</p>
                        {full && <p className="truncate text-sm text-muted-foreground">{[full.role, full.company].filter(Boolean).join(" · ")}</p>}
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 rounded-xl bg-surface p-4 text-sm text-muted-foreground">{t("speakers.tbc")}</p>
          )}
        </section>

        {s.pageUrl && (
          <a href={s.pageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary underline underline-offset-4">
            {t("moreInfo")} <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
    </article>
  );
}
