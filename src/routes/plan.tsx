import { useTrackView } from '@/hooks/use-track-view';
import {track} from '@/lib/analytics';
import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { useI18n } from "@/lib/i18n";

// Replace these files in /public/plans with the real floor plans (same names, any image format → update paths).
const FLOORS = [
  { id: "rdc", key: "floor.rdc", src: "/plans/rdc.svg" },
  { id: "f1", key: "floor.f1", src: "/plans/etage-1.svg" },
] as const;

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Plan · GenAI Days Agora" },
      { name: "description", content: "Plan de l'Hôtel de Région Pays de la Loire : rez-de-chaussée et 1er étage." },
      { property: "og:title", content: "Plan · GenAI Days Agora" },
      { property: "og:description", content: "Retrouvez la Salle Loire et l'Hémicycle." },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const { t } = useI18n();
  const [floor, setFloor] = useState<(typeof FLOORS)[number]["id"]>("rdc");
  const current = FLOORS.find((f) => f.id === floor) ?? FLOORS[0];
  useTrackView('map_viewed', { floor });
  const zoomed = useRef<string | null>(null);
  const mapArea = useRef<HTMLDivElement>(null);
  const [mapHeight, setMapHeight] = useState<number>();

  useEffect(() => {
    const area = mapArea.current;
    if (!area) return;
    const navigation = document.querySelector<HTMLElement>('nav.pb-safe');
    const updateHeight = () => {
      const navigationHeight = navigation?.getBoundingClientRect().height ?? 0;
      // Measure from the page's initial position, not its current scroll position.
      const top = area.getBoundingClientRect().top + window.scrollY;
      setMapHeight(Math.max(1, window.innerHeight - top - navigationHeight));
    };
    const observer = new ResizeObserver(updateHeight);
    if (area.previousElementSibling) observer.observe(area.previousElementSibling);
    if (navigation) observer.observe(navigation);
    window.addEventListener('resize', updateHeight);
    updateHeight();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return (
    <>
      <div className="px-4 pt-5">
        <h1 className="text-page">{t("plan.title")}</h1>
        <div className="mt-4 flex border-b border-foreground/80" role="tablist">
          {FLOORS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={floor === f.id}
              onClick={() => setFloor(f.id)}
              className={`-mb-px min-h-11 flex-1 border-b-2 py-2 text-xs font-bold uppercase tracking-[0.08em] ${floor === f.id ? "border-primary text-primary" : "border-transparent text-foreground"}`}
            >
              {t(f.key)}
            </button>
          ))}
        </div>
      </div>
      <div ref={mapArea} className="bleed-window relative h-[calc(100dvh-13rem)] border-y border-foreground/80 bg-card" style={mapHeight === undefined ? undefined : { height: mapHeight }}>
        <TransformWrapper key={floor} onZoomStop={(ref) => { if (ref.state.scale > 1 && zoomed.current !== floor) { zoomed.current = floor; track('map_zoomed', { floor }); } }} minScale={1} maxScale={5} doubleClick={{ mode: "toggle", step: 1.5 }}>
          {({ zoomIn, zoomOut }) => (
            <>
              <TransformComponent wrapperClass="!h-full !w-full touch-none" contentClass="!h-full !w-full">
                <img src={current.src} alt={`${t("plan.coming")} · ${t(current.key)}`} className="h-full w-full select-none object-contain object-center" draggable={false} />
              </TransformComponent>
              <div className="absolute right-2 top-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => zoomIn()}
                  aria-label={t("plan.zoomIn")}
                  className="flex size-11 items-center justify-center border-2 border-foreground bg-card"
                >
                  <Plus className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => zoomOut()}
                  aria-label={t("plan.zoomOut")}
                  className="flex size-11 items-center justify-center border-2 border-foreground bg-card"
                >
                  <Minus className="size-4" />
                </button>
              </div>
            </>
          )}
        </TransformWrapper>
      </div>
      <p className="font-label mt-3 px-4 text-center text-xs text-muted-foreground">{t("plan.hint")}</p>
    </>
  );
}
