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
        <ul className="grid grid-cols-2 gap-px border-y border-foreground/80 bg-foreground/80 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((s) => (
            <li key={s.id} className="bg-background">
              <Link to="/speakers/$id" params={{ id: s.id }} className="group flex h-full flex-col">
                <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-surface">
                  {s.photo && <img src={s.photo} alt="" loading="lazy" className="absolute inset-0 size-full object-cover grayscale transition-[filter] duration-200 group-hover:grayscale-0" />}
                  {s.eventRole && (
                    <span className="font-label sticker absolute left-2 top-2 max-w-[85%] truncate bg-accent px-1.5 py-0.5 text-[10px] text-night">
                      {s.eventRole}
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 grow flex-col border-t border-foreground/80 px-3 pb-4 pt-3">
                  <p className="font-display line-clamp-1 text-lg font-semibold leading-tight">{s.name}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-foreground">{s.role || "\u00a0"}</p>
                  <p className="font-label mt-1 line-clamp-1 text-[10.5px] text-muted-foreground">{s.company || "\u00a0"}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
