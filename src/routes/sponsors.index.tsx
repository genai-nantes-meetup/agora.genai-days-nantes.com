import {track} from '@/lib/analytics';
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
      { title: "Sponsors · GenAI Days Agora" },
      { name: "description", content: "Les sponsors et partenaires des GenAI Days 2026 à Nantes : Platinum, Gold et Silver." },
      { property: "og:title", content: "Sponsors · GenAI Days Agora" },
      { property: "og:description", content: "Découvrez les entreprises qui soutiennent les GenAI Days 2026." },
    ],
  }),
  component: SponsorsPage,
});

function WebsiteLink({ url, id, tier }: { url: string; id: string; tier: string }) {
  const { t } = useI18n();
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => { e.stopPropagation(); track('sponsor_link_clicked', { sponsor_id: id, tier }); }}
      className="inline-flex min-h-11 items-center gap-1 text-xs font-bold tracking-[0.04em] text-primary underline underline-offset-2"
    >
      {t("sponsors.visit")} <ExternalLink className="size-3.5" />
    </a>
  );
}

function SponsorCard({ s, tier }: { s: Sponsor; tier: SponsorTier }) {
  const size: Record<SponsorTier, string> = { platinum: "h-28 sm:h-32", gold: "h-20", silver: "h-14" };
  return (
    <li className="flex flex-col items-center gap-2 text-center">
      <Link to="/sponsors/$id" params={{ id: s.id }} aria-label={s.name} className="flex w-full justify-center">
        <SponsorLogo sponsor={s} className={size[tier]} />
      </Link>
      {s.coOrganizer && <CoOrgBadge />}
      {s.website && tier !== "silver" && <WebsiteLink url={s.website} id={s.id} tier={tier} />}
    </li>
  );
}

function SponsorsPage() {
  const { t } = useI18n();
  const { data, offlineAt, isPending, isError, refetch } = useSponsors();
  const groups = groupSponsors(data?.sponsors ?? []);
  const grid: Record<SponsorTier, string> = {
    platinum: "grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-16",
    gold: "grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3",
    silver: "grid-cols-3 gap-x-6 gap-y-8 sm:grid-cols-4 lg:grid-cols-5",
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
        <p className="m-4 bg-surface p-6 text-center text-sm text-muted-foreground">{t("sponsors.empty")}</p>
      ) : (
        <div className="px-gutter divide-y divide-surface py-6">
          {groups.map(({ tier, sponsors }) => (
            <section key={tier} className="py-[var(--space-close)] first:pt-2">
              <h2 className="sr-only">{t(`tier.${tier}` as TKey)}</h2>
              <ul className={`grid items-center ${grid[tier]}`}>
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
