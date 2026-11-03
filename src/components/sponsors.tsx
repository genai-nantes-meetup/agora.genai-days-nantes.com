import type { Sponsor } from "@/lib/event";
import { useI18n } from "@/lib/i18n";

export function CoOrgBadge() {
  const { t } = useI18n();
  return (
    <span className="font-label sticker inline-block bg-accent px-1.5 py-0.5 text-[10px] text-night">
      {t("sponsors.coorg")}
    </span>
  );
}

export function SponsorLogo({ sponsor, className }: { sponsor: Sponsor; className: string }) {
  return (
    <div className={`flex w-full items-center justify-center p-1 ${className}`}>
      {sponsor.logo ? (
        <img src={sponsor.logo} alt={sponsor.name} loading="lazy" className="max-h-full max-w-full object-contain grayscale contrast-125" />
      ) : (
        <span className="font-display text-xl font-extrabold">{sponsor.name}</span>
      )}
    </div>
  );
}

