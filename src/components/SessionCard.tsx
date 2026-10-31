import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { endTime, resolveRoom, type Session } from "@/lib/event";
import { useI18n, type TKey } from "@/lib/i18n";
import { LikeButton, TrackTag, trackBorder } from "./common";

export function SessionCard({
  session,
  liked,
  onLike,
  now,
}: {
  session: Session;
  liked: boolean;
  onLike: () => void;
  now?: "live" | "next" | undefined;
}) {
  const { t } = useI18n();
  const { room, floor } = resolveRoom(session);
  const speakers = session.speakers ?? [];

  return (
    <Link
      to="/sessions/$id"
      params={{ id: session.id }}
      id={`s-${session.id}`}
      className={`relative block min-w-0 scroll-mt-32 rounded-xl border-l-4 bg-card p-3.5 shadow-card transition-transform active:scale-[0.99] ${trackBorder[session.track] ?? trackBorder["commun"]} ${now === "live" ? "ring-2 ring-accent" : ""}`}
    >
      {now && (
        <span className={`font-label absolute -top-2.5 right-3 rounded-full bg-accent px-2 py-0.5 text-[11px] uppercase text-accent-foreground ${now === "live" ? "now-pulse" : ""}`}>
          {now === "live" ? t("now") : t("next")}
        </span>
      )}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <TrackTag track={session.track} />
            <span className="font-label text-[11px] uppercase text-muted-foreground">
              {t(`format.${session.format}` as TKey) || session.format}
            </span>
          </div>
          <h3 className="mt-1.5 text-lg font-semibold leading-snug">{session.title}</h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {speakers.length ? speakers.map((s) => s.name).join(", ") : t("speakers.tbc")}
          </p>
          <p className="font-label mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">{session.startTime}–{endTime(session)}</span>
            <span aria-hidden>·</span>
            <MapPin className="size-3" />
            <span className="min-w-0 truncate">
              {room ?? t("room.tbc")}
              {floor ? ` · ${t(`floor.${floor}`)}` : ""}
            </span>
          </p>
        </div>
        <LikeButton liked={liked} onClick={onLike} />
      </div>
    </Link>
  );
}
