import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, CloudOff, Heart, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Track } from "@/lib/event";

export function LoadingView() {
  const { t } = useI18n();
  return (
    <div className="space-y-3 p-4" aria-busy="true">
      <span className="sr-only">{t("loading")}</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-surface" />
      ))}
    </div>
  );
}

export function ErrorView({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="m-4 rounded-xl bg-surface p-6 text-center">
      <p className="text-sm">{t("error")}</p>
      <button onClick={onRetry} className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
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
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
    >
      <ArrowLeft className="size-4" />
      {t("back")}
    </button>
  );
}

const trackStyles: Record<string, string> = {
  tech: "bg-track-tech text-secondary-foreground",
  decideurs: "bg-track-decideurs text-accent-foreground",
  commun: "bg-track-commun text-primary-foreground",
};
export const trackBorder: Record<string, string> = {
  tech: "border-l-track-tech",
  decideurs: "border-l-track-decideurs",
  commun: "border-l-track-commun",
};

export function TrackTag({ track }: { track: Track | string }) {
  const { t } = useI18n();
  const key = (["tech", "decideurs", "commun"].includes(track) ? `track.${track}` : "track.commun") as "track.tech";
  return (
    <span className={`font-label inline-block rounded px-1.5 py-0.5 text-[11px] uppercase ${trackStyles[track] ?? trackStyles["commun"]}`}>
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
      className={`flex shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 ${size === "lg" ? "size-12 bg-surface" : "size-10"}`}
    >
      <Heart className={`${size === "lg" ? "size-6" : "size-5"} ${liked ? "fill-like text-like" : "text-muted-foreground"}`} />
    </button>
  );
}

export function ComingSoon() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-8 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-accent">
        <Sparkles className="size-7 text-accent-foreground" />
      </div>
      <h1 className="text-4xl font-medium">{t("soon.title")}</h1>
      <p className="mt-3 max-w-xs text-muted-foreground">{t("soon.body")}</p>
      <Link to="/" className="mt-8 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
        {t("soon.cta")}
      </Link>
    </div>
  );
}

export function ProgramTabs({ active }: { active: "program" | "speakers" | "sponsors" }) {
  const { t } = useI18n();
  const cls = (on: boolean) =>
    `flex-1 rounded-full py-2 text-center text-sm font-bold transition-colors ${on ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`;
  return (
    <div className="mx-4 mt-4 flex rounded-full bg-surface p-1">
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
    <p role="status" className="font-label mx-4 mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
      <CloudOff className="size-3.5" /> {t("data.offline", { time })}
    </p>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-semibold uppercase tracking-tight ${className}`}>
      GEN<span className="font-extrabold italic">AI</span> DAYS
    </span>
  );
}
