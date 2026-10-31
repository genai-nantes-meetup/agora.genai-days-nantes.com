import type { Sponsor } from "@/lib/event";
import { useI18n } from "@/lib/i18n";

export function CoOrgBadge() {
  const { t } = useI18n();
  return (
    <span className="font-label inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-secondary-foreground">
      {t("sponsors.coorg")}
    </span>
  );
}

export function SponsorLogo({ sponsor, className }: { sponsor: Sponsor; className: string }) {
  return (
    <div className={`flex items-center justify-center rounded-lg bg-card p-3 ${className}`}>
      {sponsor.logo ? (
        <img src={sponsor.logo} alt={sponsor.name} loading="lazy" className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="font-display text-xl font-extrabold">{sponsor.name}</span>
      )}
    </div>
  );
}

