import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Coffee, Utensils } from "lucide-react";
import { displayTitle, endTime, resolveRoom, type Session } from "@/lib/event";
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
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const showImage = Boolean(session.image && session.image !== failedImage);

  if (session.kind === "break" || session.kind === "lunch") {
    const Icon = session.kind === "lunch" ? Utensils : Coffee;
    return <div id={`s-${session.id}`} className={`flex scroll-mt-32 items-center gap-3 bg-surface px-4 py-3 ${now === "live" ? "border-l-[3px] border-accent" : ""}`}><Icon aria-hidden="true" className="size-5 shrink-0 text-ink"/><div className="min-w-0"><h3 className="text-lg font-semibold italic leading-tight">{session.title}</h3><p className="font-label mt-1 text-xs text-muted-foreground">{session.startTime}–{endTime(session)}{now ? ` · ${t(now === "live" ? "now" : "next")}` : ""}</p></div></div>;
  }

  return (
    <Link
      to="/sessions/$id"
      params={{ id: session.id }}
      id={`s-${session.id}`}
      className={`@container relative block min-w-0 scroll-mt-32 border-l-[3px] bg-card transition-transform active:scale-[0.99] ${trackBorder[session.track] ?? trackBorder["commun"]} ${now === "live" ? "outline outline-2 outline-offset-0 outline-accent" : ""}`}
    >
      {now && (
        <span className={`font-label sticker absolute -top-2.5 right-12 bg-accent px-2 py-0.5 text-[11px] text-ink ${now === "live" ? "now-pulse" : ""}`}>
          {now === "live" ? t("now") : t("next")}
        </span>
      )}
      <div className={showImage ? "grid min-w-0 @min-[34rem]:grid-cols-[minmax(7rem,11rem)_minmax(0,1fr)]" : ""}>
        {showImage && session.image && (
          <div className="relative aspect-[16/7] overflow-hidden @min-[34rem]:aspect-auto">
            <img
              src={session.image}
              alt=""
              loading="lazy"
              decoding="async"
              width={640}
              height={280}
              onError={() => setFailedImage(session.image ?? null)}
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        )}
      <div className="min-w-0 p-4">
      <div className="-mr-2 -mt-2 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {session.track !== "tech" && session.track !== "decideurs" && <TrackTag track={session.track} />}
            <span className="font-label text-[11px] text-muted-foreground">
              {t(`format.${session.format}` as TKey) || session.format}
            </span>
          </div>
          <h3 className="mt-2 text-[1.25rem] font-semibold leading-[1.15]">{displayTitle(session)}</h3>
          <p className="mt-1.5 truncate text-sm text-foreground">
            {speakers.length ? speakers.map((s) => s.name).join(", ") : t("speakers.tbc")}
          </p>
          <p className="font-label mt-3 text-[11px] text-muted-foreground">
            <span className="block whitespace-nowrap">{session.startTime}–{endTime(session)}</span>
            <span className="mt-0.5 flex items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              <span className="min-w-0">
                {room ?? t("room.tbc")}
                {floor ? ` · ${t(`floor.${floor}`)}` : ""}
              </span>
            </span>
          </p>
        </div>
        <LikeButton liked={liked} onClick={onLike} />
      </div>
      </div>
      </div>
    </Link>
  );
}
