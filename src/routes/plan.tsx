import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
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
      { title: "Plan · Hey GenAI Days" },
      { name: "description", content: "Plan de l'Hôtel de Région Pays de la Loire : rez-de-chaussée et 1er étage." },
      { property: "og:title", content: "Plan · Hey GenAI Days" },
      { property: "og:description", content: "Retrouvez la Salle Loire et l'Hémicycle." },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const { t } = useI18n();
  const [floor, setFloor] = useState<(typeof FLOORS)[number]["id"]>("rdc");
  const current = FLOORS.find((f) => f.id === floor)!;

  return (
    <div className="px-4 pt-5">
      <h1 className="text-4xl font-medium">{t("plan.title")}</h1>
      <div className="mt-4 flex rounded-full bg-surface p-1" role="tablist">
        {FLOORS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={floor === f.id}
            onClick={() => setFloor(f.id)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${floor === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {t(f.key)}
          </button>
        ))}
      </div>
      <div className="relative mt-4 overflow-hidden rounded-xl border bg-card shadow-card">
        <TransformWrapper key={floor} minScale={1} maxScale={5} doubleClick={{ mode: "toggle", step: 1.5 }}>
          {({ resetTransform }) => (
            <>
              <TransformComponent wrapperClass="!w-full touch-none" contentClass="!w-full">
                <img src={current.src} alt={`${t("plan.coming")} · ${t(current.key)}`} className="w-full select-none" draggable={false} />
              </TransformComponent>
              <button
                type="button"
                onClick={() => resetTransform()}
                aria-label={t("plan.reset")}
                className="absolute right-2 top-2 rounded-full bg-card/90 p-2 shadow-card"
              >
                <RotateCcw className="size-4" />
              </button>
            </>
          )}
        </TransformWrapper>
      </div>
      <p className="font-label mt-3 text-center text-xs text-muted-foreground">{t("plan.hint")}</p>
    </div>
  );
}
