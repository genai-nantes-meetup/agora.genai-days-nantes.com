import { createFileRoute, Link } from "@tanstack/react-router";
import { useSpeakers } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { ErrorView, LoadingView, OfflineDataNote, ProgramTabs } from "@/components/common";

export const Route = createFileRoute("/speakers/")({
  head: () => ({
    meta: [
      { title: "Speakers · Hey GenAI Days" },
      { name: "description", content: "Les intervenantes et intervenants des GenAI Days 2026 à Nantes." },
      { property: "og:title", content: "Speakers · Hey GenAI Days" },
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
      <div className="px-4 pt-5">
        <p className="font-label text-xs uppercase text-muted-foreground">{list.length || ""} speakers</p>
        <h1 className="mt-1 text-4xl font-extrabold">{t("speakers")}</h1>
      </div>
      {isPending ? (
        <LoadingView />
      ) : isError || !data ? (
        <ErrorView onRetry={() => refetch()} />
      ) : !list.length ? (
        <p className="p-6 text-center text-muted-foreground">{t("speakers.empty")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
          {list.map((s) => (
            <li key={s.id}>
              <Link to="/speakers/$id" params={{ id: s.id }} className="flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-card">
                <div className="aspect-square bg-surface">
                  {s.photo && <img src={s.photo} alt="" loading="lazy" className="size-full object-cover" />}
                </div>
                <div className="grid h-36 grid-rows-[1.25rem_3.25rem_2.25rem] gap-1 p-3">
                  {s.eventRole && (
                    <span className="font-label w-fit max-w-full truncate rounded bg-accent px-1.5 py-0.5 text-[10px] uppercase text-accent-foreground">
                      {s.eventRole}
                    </span>
                  ) || <span aria-hidden="true" />}
                  <p className="font-display line-clamp-2 text-lg font-semibold leading-tight">{s.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {[s.role, s.company].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
