import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { groupSponsors, type Sponsor, type SponsorTier } from "@/lib/event";
import { useSponsors } from "@/lib/data";
import { useI18n, type TKey } from "@/lib/i18n";
import { CoOrgBadge, SponsorLogo } from "@/components/sponsors";
import { ErrorView, LoadingView, OfflineDataNote, ProgramTabs } from "@/components/common";

export const Route = createFileRoute("/sponsors/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Sponsors · GenAI Days Nantes" },
      { name: "description", content: "Les sponsors et partenaires des GenAI Days 2026 à Nantes : Platinum, Gold et Silver." },
      { property: "og:title", content: "Sponsors · GenAI Days Nantes" },
      { property: "og:description", content: "Découvrez les entreprises qui soutiennent les GenAI Days 2026." },
    ],
  }),
  component: SponsorsPage,
});

function WebsiteLink({ url }: { url: string }) {
  const { t } = useI18n();
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="relative z-10 inline-flex items-center gap-1 text-sm font-bold text-secondary underline-offset-2 hover:underline"
    >
      {t("sponsors.visit")} <ExternalLink className="size-3.5" />
    </a>
  );
}

function SponsorCard({ s, tier }: { s: Sponsor; tier: SponsorTier }) {
  const big = tier === "platinum";
  const mid = tier === "gold";
  return (
    <li className="relative overflow-hidden rounded-xl bg-surface shadow-card">
      <Link to="/sponsors/$id" params={{ id: s.id }} className="absolute inset-0" aria-label={s.name} />
      <div className={big ? "p-4" : "p-3"}>
        <SponsorLogo sponsor={s} className={big ? "h-28" : mid ? "h-20" : "h-14"} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {s.coOrganizer && <CoOrgBadge />}
          <p className={`font-bold ${big ? "text-lg" : "text-sm"}`}>{s.name}</p>
        </div>
        {s.description && tier !== "silver" && (
          <p className={`mt-1 text-sm text-muted-foreground ${big ? "line-clamp-3" : "line-clamp-2"}`}>{s.description}</p>
        )}
        {s.website && (
          <div className="mt-2">
            <WebsiteLink url={s.website} />
          </div>
        )}
      </div>
    </li>
  );
}

function SponsorsPage() {
  const { t } = useI18n();
  const { data, offlineAt, isPending, isError, refetch } = useSponsors();
  const groups = groupSponsors(data?.sponsors ?? []);
  const grid: Record<SponsorTier, string> = {
    platinum: "grid-cols-1",
    gold: "grid-cols-1 sm:grid-cols-2",
    silver: "grid-cols-2 sm:grid-cols-3",
  };

  return (
    <div>
      <ProgramTabs active="sponsors" />
      <OfflineDataNote at={offlineAt} />
      {isPending ? (
        <LoadingView />
      ) : isError || !data ? (
        <ErrorView onRetry={() => refetch()} />
      ) : !groups.length ? (
        <p className="m-4 rounded-xl bg-surface p-6 text-center text-sm text-muted-foreground">{t("sponsors.empty")}</p>
      ) : (
        <div className="space-y-8 p-4">
          {groups.map(({ tier, sponsors }) => (
            <section key={tier}>
              <h2 className="text-3xl font-extrabold">{t(`tier.${tier}` as TKey)}</h2>
              <ul className={`mt-3 grid gap-3 ${grid[tier]}`}>
                {sponsors.map((s) => (
                  <SponsorCard key={s.id} s={s} tier={tier} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
