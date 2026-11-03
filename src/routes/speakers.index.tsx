import { createFileRoute, Link } from "@tanstack/react-router";
import { useSpeakers } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { ErrorView, LoadingView, OfflineDataNote, ProgramTabs } from "@/components/common";

export const Route = createFileRoute("/speakers/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Speakers · GenAI Days Agora" },
      { name: "description", content: "Les intervenantes et intervenants des GenAI Days 2026 à Nantes." },
      { property: "og:title", content: "Speakers · GenAI Days Agora" },
      { property: "og:description", content: "Découvrez les speakers, jurys et modérateurs des GenAI Days." },
    ],
  }),
  component: SpeakersPage,
});

function SpeakersPage() {
  const { t } = useI18n();
  const { data, offlineAt, isPending, isError, refetch } = useSpeakers();
  const list = data?.speakers ?? [];

  return (
    <div>
      <ProgramTabs active="speakers" />
      <OfflineDataNote at={offlineAt} />
      <div className="px-gutter pb-5 pt-7">
        <p className="font-label text-xs text-muted-foreground">{list.length || ""} speakers</p>
        <h1 className="text-page mt-3">{t("speakers")}</h1>
      </div>
      {isPending ? (
        <LoadingView />
      ) : isError || !data ? (
        <ErrorView onRetry={() => refetch()} />
      ) : !list.length ? (
        <p className="p-6 text-center text-muted-foreground">{t("speakers.empty")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-px border border-ink/18 bg-ink/18 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((s) => (
            <li key={s.id} className="min-w-0 bg-card">
              <Link to="/speakers/$id" params={{ id: s.id }} className="speaker-tile relative flex h-full min-w-0 flex-col bg-card">
                <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-surface">
                  {s.photo && <img src={s.photo} alt="" loading="lazy" className="speaker-photo absolute inset-0 size-full object-cover object-[50%_28%]" />}
                  {s.eventRole && (
                    <span className="absolute left-[0.85rem] top-[0.85rem] max-w-[calc(100%-1.7rem)] origin-top-left -rotate-[1.5deg] truncate whitespace-nowrap bg-accent px-[0.6rem] pb-[0.35rem] pt-[0.4rem] font-sans text-[0.625rem] font-bold uppercase tracking-[0.06em] text-night">
                      {s.eventRole}
                    </span>
                  )}
                </div>
                <div className="speaker-caption flex min-w-0 grow flex-col px-3 pb-4 pt-3">
                  <p className="truncate font-display text-xl font-semibold leading-[1.05] tracking-[-0.025em] sm:text-2xl">{s.name}</p>
                  <p className="mt-1 truncate font-sans text-xs font-medium text-ink/76">{s.role || "\u00a0"}</p>
                  <p className="mt-1 truncate font-sans text-xs font-medium uppercase tracking-[0.05em] text-ink/54">{s.company || "\u00a0"}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
