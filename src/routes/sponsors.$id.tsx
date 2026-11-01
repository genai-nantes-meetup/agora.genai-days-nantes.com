import { useTrackView } from '@/hooks/use-track-view';
import {track} from '@/lib/analytics';
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useSponsors } from "@/lib/data";
import { useI18n, type TKey } from "@/lib/i18n";
import { BackLink, ErrorView, LoadingView, OfflineDataNote } from "@/components/common";
import { CoOrgBadge, SponsorLogo } from "@/components/sponsors";

export const Route = createFileRoute("/sponsors/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Sponsor · GenAI Days Agora" },
      { name: "description", content: "Présentation d'un sponsor des GenAI Days 2026 à Nantes." },
      { property: "og:title", content: "Sponsor · GenAI Days Agora" },
      { property: "og:description", content: "Un des partenaires qui soutiennent les GenAI Days 2026." },
    ],
  }),
  component: SponsorPage,
});

function SponsorPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const { data, offlineAt, isPending, isError, refetch } = useSponsors();
  const tier = data?.sponsors.find((x) => x.id === id)?.tier ?? undefined;
  useTrackView('sponsor_viewed', { sponsor_id: id, tier: tier ?? undefined }, !!data);

  if (isPending) return <LoadingView />;
  if (isError || !data) return <ErrorView onRetry={() => refetch()} />;
  const s = data.sponsors.find((x) => x.id === id);
  if (!s) return <p className="p-6 text-center">{t("notFound")}</p>;

  return (
    <article className="space-y-5 px-4 pb-6 pt-4">
      <BackLink to="/sponsors" />
      <OfflineDataNote at={offlineAt} />
      <SponsorLogo sponsor={s} className="h-40 shadow-card" />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-label rounded bg-accent px-1.5 py-0.5 text-[11px] uppercase text-accent-foreground">
            {t(`tier.${s.tier}` as TKey)}
          </span>
          {s.coOrganizer && <CoOrgBadge />}
        </div>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight">{s.name}</h1>
      </div>
      {s.description && <p className="whitespace-pre-line leading-relaxed">{s.description}</p>}
      <div className="flex flex-wrap gap-3">
        {s.website && (
          <a onClick={() => track('sponsor_link_clicked', { sponsor_id: s.id, tier: s.tier ?? undefined })} href={s.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
            {t("sponsors.visit")} <ExternalLink className="size-4" />
          </a>
        )}
        {s.pageUrl && (
          <a onClick={() => track('sponsor_link_clicked', { sponsor_id: s.id, tier: s.tier ?? undefined })} href={s.pageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-bold">
            {t("moreInfo")} <ExternalLink className="size-4" />
          </a>
        )}
      </div>
    </article>
  );
}
