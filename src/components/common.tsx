import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, CloudOff, Heart, Sparkles, Telescope, Wrench, Landmark } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Track } from "@/lib/event";

export function LoadingView() {
  const { t } = useI18n();
  return (
    <div className="space-y-3 p-4" aria-busy="true">
      <span className="sr-only">{t("loading")}</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-28 animate-pulse bg-surface" />
      ))}
    </div>
  );
}

export function ErrorView({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="m-4 bg-surface p-6 text-center">
      <p className="text-sm">{t("error")}</p>
      <button onClick={onRetry} className="mt-4 min-h-11 border-2 border-primary bg-primary px-6 py-3 text-sm font-bold uppercase tracking-[0.04em] text-primary-foreground shadow-ink transition-[box-shadow,transform] duration-150 hover:shadow-[var(--shadow-ink-pressed)] active:scale-[0.96]">
        {t("retry")}
      </button>
    </div>
  );
}

export function BackLink({ to = "/" }: { to?: "/" | "/speakers" | "/sponsors" }) {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to }))}
      className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-bold tracking-[0.04em] text-primary hover:underline"
    >
      <ArrowLeft className="size-4" />
      {t("back")}
    </button>
  );
}

const trackStyles: Record<string, string> = {
  tech: "bg-track-tech text-primary-foreground",
  decideurs: "bg-track-decideurs text-ink",
  commun: "bg-track-commun text-primary-foreground",
};
export const trackBorder: Record<string, string> = {
  tech: "border-l-track-tech",
  decideurs: "border-l-track-decideurs",
  commun: "border-l-track-commun",
};

export const trackIcon = { tech: Wrench, decideurs: Telescope, commun: Landmark } as const;

export function TrackTag({ track }: { track: Track | string }) {
  const { t } = useI18n();
  const key = (["tech", "decideurs", "commun"].includes(track) ? `track.${track}` : "track.commun") as "track.tech";
  return (
    <span className={`font-label inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] ${trackStyles[track] ?? trackStyles["commun"]}`}>
      {(() => { const I = trackIcon[(track in trackIcon ? track : "commun") as keyof typeof trackIcon]; return <I aria-hidden="true" className="size-3" strokeWidth={2.25} />; })()}
      {t(key)}
    </span>
  );
}

export function LikeButton({ liked, onClick, size = "md" }: { liked: boolean; onClick: () => void; size?: "md" | "lg" }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? t("like.remove") : t("like.add")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`flex shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 ${size === "lg" ? "size-12 bg-surface" : "size-11"}`}
    >
      <Heart className={`${size === "lg" ? "size-6" : "size-5"} ${liked ? "fill-like text-ink" : "text-ink"}`} />
    </button>
  );
}

export function ComingSoon() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-8 text-center">
      <div className="sticker mb-6 flex size-16 items-center justify-center bg-accent">
        <Sparkles className="size-7 text-accent-foreground" />
      </div>
      <h1 className="text-page">{t("soon.title")}</h1>
      <p className="mt-3 max-w-xs text-muted-foreground">{t("soon.body")}</p>
      <Link to="/" className="mt-8 min-h-11 border-2 border-primary bg-primary px-6 py-3 text-sm font-bold uppercase tracking-[0.04em] text-primary-foreground shadow-ink">
        {t("soon.cta")}
      </Link>
    </div>
  );
}

export function ProgramTabs({ active }: { active: "program" | "speakers" | "sponsors" }) {
  const { t } = useI18n();
  const cls = (on: boolean) =>
    `-mb-px flex min-h-11 flex-1 items-center justify-center border-b-2 px-2 text-center text-xs font-bold uppercase tracking-[0.08em] transition-colors sm:flex-none sm:px-0 ${on ? "border-primary text-primary" : "border-transparent text-foreground hover:text-primary"}`;
  return (
    <div className="px-gutter mt-2 flex gap-6 border-b border-foreground/80">
      <Link to="/" className={cls(active === "program")}>{t("tabs.program")}</Link>
      <Link to="/speakers" className={cls(active === "speakers")}>{t("tabs.speakers")}</Link>
      <Link to="/sponsors" className={cls(active === "sponsors")}>{t("tabs.sponsors")}</Link>
    </div>
  );
}

/** Discreet notice shown when data comes from the on-device copy. */
export function OfflineDataNote({ at }: { at: number | null }) {
  const { t } = useI18n();
  if (!at) return null;
  const time = new Date(at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  return (
    <p role="status" className="font-label px-gutter mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
      <CloudOff className="size-3.5" /> {t("data.offline", { time })}
    </p>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display uppercase tracking-tight ${className}`}>
      <span className="font-bold">GEN<span className="italic">AI</span></span> <span className="font-normal">DAYS</span>
    </span>
  );
}

/** Header lockup: GENAI DAYS wordmark with the short app name stacked below. */
export function AppLockup({ shortName, label }: { shortName: string; label: string }) {
  return (
    <span aria-label={label} className="flex flex-col leading-none">
      <Wordmark className="text-[1.375rem] leading-none" />
      <span aria-hidden="true" className="font-display text-[0.8125rem] font-semibold italic leading-none text-accent">{shortName}</span>
    </span>
  );
}
